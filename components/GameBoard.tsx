import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board, Tile, TileType, PowerUpType, LevelConfig, TileSpecial } from '../types';
import { createBoard, findMatchGroups, refillBoard, applyPowerUp, triggerSpecialEffect } from '../services/gameLogic';
import { TileComponent } from './TileComponent';
import { BOARD_SIZE, ANIMATION_DELAY } from '../constants';

interface GameBoardProps {
  levelConfig: LevelConfig;
  activePowerUp: PowerUpType | null;
  onScore: (points: number) => void;
  onPowerUpUsed: () => void;
  onGameOver: (won: boolean) => void;
  gameActive: boolean;
}

const GameBoardBase: React.FC<GameBoardProps> = ({ 
  levelConfig, activePowerUp, onScore, onPowerUpUsed, onGameOver, gameActive 
}) => {
  const [board, setBoard] = useState<Board>([]);
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStart = useRef<{tileX: number, tileY: number, clientX: number, clientY: number} | null>(null);

  useEffect(() => {
    setBoard(createBoard(levelConfig.colors));
    setSelectedTile(null);
    setIsProcessing(false);
    dragStart.current = null;
  }, [levelConfig]);

  const processBoard = useCallback((currentBoard: Board, fromSwap = false, swappedCoords?: {x1:number, y1:number, x2:number, y2:number}) => {
    const groups = findMatchGroups(currentBoard);
    
    if (groups.length > 0) {
      setIsProcessing(true);
      
      const newBoard = currentBoard.map(row => [...row]);
      let totalPoints = 0;
      const tilesToRemove = new Set<string>();
      
      // Optimization: Use Map for O(1) lookup during board regeneration
      const creationMap = new Map<string, TileSpecial>();

      groups.forEach(group => {
        const length = group.tiles.length;
        totalPoints += length * 20 * (fromSwap ? 1 : 1.5);

        let specialCreated: TileSpecial = TileSpecial.NONE;
        if (length >= 5) specialCreated = TileSpecial.COLOR_BOMB;
        else if (length === 4) specialCreated = TileSpecial.ROW_BLAST;

        if (specialCreated !== TileSpecial.NONE) {
          let targetTile = group.tiles[0];
          if (fromSwap && swappedCoords) {
             const swapMatch = group.tiles.find(t => 
               (t.x === swappedCoords.x1 && t.y === swappedCoords.y1) || 
               (t.x === swappedCoords.x2 && t.y === swappedCoords.y2)
             );
             if (swapMatch) targetTile = swapMatch;
          } else {
             targetTile = group.tiles[Math.floor(length/2)];
          }
          creationMap.set(`${targetTile.x},${targetTile.y}`, specialCreated);
          group.tiles.forEach(t => {
            if (t.id !== targetTile.id) tilesToRemove.add(t.id);
          });
        } else {
          group.tiles.forEach(t => tilesToRemove.add(t.id));
        }

        group.tiles.forEach(t => {
           if (t.special && t.special !== TileSpecial.NONE) {
               const effects = triggerSpecialEffect(currentBoard, t);
               effects.forEach(eff => tilesToRemove.add(eff.id));
           }
        });
      });

      onScore(Math.floor(totalPoints));

      const matchedBoard = newBoard.map(row => row.map(t => {
        const shouldRemove = tilesToRemove.has(t.id);
        if (shouldRemove) return { ...t, isMatched: true };
        return t;
      }));
      
      setBoard(matchedBoard);

      processingTimeout.current = setTimeout(() => {
        const clearedBoard = matchedBoard.map(row => row.map(t => {
           const key = `${t.x},${t.y}`;
           if (creationMap.has(key)) {
             return { ...t, special: creationMap.get(key)!, isMatched: false };
           }
           if (t.isMatched) {
             return { ...t, type: TileType.EMPTY, isMatched: false, special: TileSpecial.NONE };
           }
           return t;
        }));

        const refilledBoard = refillBoard(clearedBoard, levelConfig.colors);
        setBoard(refilledBoard);
        
        processingTimeout.current = setTimeout(() => {
          processBoard(refilledBoard, false);
        }, ANIMATION_DELAY);
      }, ANIMATION_DELAY);

    } else {
      setIsProcessing(false);
    }
  }, [levelConfig.colors, onScore]);

  const performSwap = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    // This function needs to access current board state via closure, so it's tricky with useCallback
    // But since `board` changes, we need to rely on the state provided or pass it.
    // However, for swapping, we rely on the `board` state variable.
    // To make it truly efficient, we use the Functional Update pattern or just accept that it depends on `board`.
    // Since board updates often, we keep it simple but efficient.
    
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const t1 = newBoard[y1][x1];
      const t2 = newBoard[y2][x2];

      const temp = {...t1};
      newBoard[y1][x1] = {...t2, x: x1, y: y1};
      newBoard[y2][x2] = {...temp, x: x2, y: y2};

      // Trigger processing logic side-effect (needs to be outside render, but triggered here)
      // This is a complex pattern. For simplicity in this app structure:
      // We return newBoard here to update UI instantly.
      // We trigger the logic check via a timeout/effect, OR we just run the logic check here.
      
      return newBoard;
    });
    
    // We need the board data for logic, so we reconstruct:
    const tempBoard = board.map(row => [...row]);
    const t1 = tempBoard[y1][x1];
    const t2 = tempBoard[y2][x2];
    const temp = {...t1};
    tempBoard[y1][x1] = {...t2, x: x1, y: y1};
    tempBoard[y2][x2] = {...temp, x: x2, y: y2};

    setSelectedTile(null);
    setIsProcessing(true);

    setTimeout(() => {
      const groups = findMatchGroups(tempBoard);
      const isSpecialTrigger = (t1.special === TileSpecial.COLOR_BOMB || t2.special === TileSpecial.COLOR_BOMB);

      if (groups.length > 0 || isSpecialTrigger) {
         processBoard(tempBoard, true, {x1, y1, x2, y2});
      } else {
        // Revert
        setBoard(prev => {
             const rev = prev.map(row => [...row]);
             const r1 = rev[y1][x1];
             const r2 = rev[y2][x2];
             rev[y1][x1] = {...r2, x: x1, y: y1};
             rev[y2][x2] = {...r1, x: x2, y: y2};
             return rev;
        });
        setIsProcessing(false);
      }
    }, 150);
  }, [board, processBoard]); // Dependencies

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameActive || isProcessing) return;

    if (activePowerUp) {
      setIsProcessing(true);
      const targets = applyPowerUp(board, activePowerUp, x, y);
      const newBoard = board.map(row => [...row]);
      targets.forEach(t => { newBoard[t.y][t.x].isMatched = true; });
      setBoard(newBoard);
      onPowerUpUsed();

      processingTimeout.current = setTimeout(() => {
        const clearedBoard = newBoard.map(row => row.map(t => 
           t.isMatched ? { ...t, type: TileType.EMPTY, isMatched: false, special: TileSpecial.NONE } : t
        ));
        const refilled = refillBoard(clearedBoard, levelConfig.colors);
        setBoard(refilled);
        setTimeout(() => processBoard(refilled, false), ANIMATION_DELAY);
      }, ANIMATION_DELAY);
      return;
    }

    if (!selectedTile) {
      setSelectedTile({ x, y });
    } else {
      if (selectedTile.x === x && selectedTile.y === y) {
        setSelectedTile(null);
        return;
      }
      const dist = Math.abs(selectedTile.x - x) + Math.abs(selectedTile.y - y);
      if (dist === 1) {
        performSwap(selectedTile.x, selectedTile.y, x, y);
      } else {
        setSelectedTile({ x, y });
      }
    }
  }, [gameActive, isProcessing, activePowerUp, board, selectedTile, levelConfig.colors, performSwap, onPowerUpUsed, processBoard]);

  const handlePointerDown = useCallback((e: React.PointerEvent, x: number, y: number) => {
    if (!gameActive || isProcessing || activePowerUp) return;
    if (e.button !== 0) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragStart.current = { tileX: x, tileY: y, clientX: e.clientX, clientY: e.clientY };
  }, [gameActive, isProcessing, activePowerUp]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || isProcessing) return;
    const dx = e.clientX - dragStart.current.clientX;
    const dy = e.clientY - dragStart.current.clientY;
    const threshold = 5; 
    
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      const { tileX, tileY } = dragStart.current;
      let targetX = tileX;
      let targetY = tileY;
      
      if (Math.abs(dx) > Math.abs(dy)) targetX += dx > 0 ? 1 : -1;
      else targetY += dy > 0 ? 1 : -1;
      
      if (targetX >= 0 && targetX < BOARD_SIZE && targetY >= 0 && targetY < BOARD_SIZE) {
        performSwap(tileX, tileY, targetX, targetY);
      }
      dragStart.current = null;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragStart.current = null;
  };

  useEffect(() => {
    return () => {
      if (processingTimeout.current) clearTimeout(processingTimeout.current);
    };
  }, []);

  return (
    <div 
      className="relative bg-slate-800 rounded shadow-sm border border-slate-700 overflow-hidden game-board-container"
      style={{ width: '100%', maxWidth: '500px', aspectRatio: '1/1', contain: 'strict' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {board.flat().map((tile) => (
        <TileComponent
          key={tile.id}
          tile={tile}
          isSelected={selectedTile?.x === tile.x && selectedTile?.y === tile.y}
          onClick={() => handleTileClick(tile.x, tile.y)}
          onPointerDown={(e) => handlePointerDown(e, tile.x, tile.y)}
        />
      ))}
    </div>
  );
};

export const GameBoard = React.memo(GameBoardBase);