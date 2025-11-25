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
  // Visual State (Triggers Renders)
  const [board, setBoard] = useState<Board>([]);
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number} | null>(null);

  // Logic State (Instant Access, No Renders)
  const boardRef = useRef<Board>([]);
  const processingRef = useRef(false);
  const activePowerUpRef = useRef(activePowerUp);
  const gameActiveRef = useRef(gameActive);
  const dragStartRef = useRef<{tileX: number, tileY: number, clientX: number, clientY: number} | null>(null);
  const processingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Sync Refs with Props/State
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { activePowerUpRef.current = activePowerUp; }, [activePowerUp]);
  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);

  // Init Board
  useEffect(() => {
    const newBoard = createBoard(levelConfig.colors);
    setBoard(newBoard);
    boardRef.current = newBoard;
    setSelectedTile(null);
    processingRef.current = false;
    dragStartRef.current = null;
  }, [levelConfig]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (processingTimeout.current) clearTimeout(processingTimeout.current);
    };
  }, []);

  // --- CORE LOGIC (Stable - No Dependencies) ---

  const processBoardLogic = useCallback((currentBoard: Board, fromSwap = false, swappedCoords?: {x1:number, y1:number, x2:number, y2:number}) => {
    const groups = findMatchGroups(currentBoard);
    
    if (groups.length > 0) {
      processingRef.current = true;
      
      // Calculate Score & Specials
      const newBoard = currentBoard.map(row => [...row]);
      let totalPoints = 0;
      const tilesToRemove = new Set<string>();
      const creationMap = new Map<string, TileSpecial>();

      groups.forEach(group => {
        const length = group.tiles.length;
        totalPoints += length * 20 * (fromSwap ? 1 : 1.5);

        let specialCreated: TileSpecial = TileSpecial.NONE;
        if (length >= 5) specialCreated = TileSpecial.COLOR_BOMB;
        else if (length === 4) specialCreated = TileSpecial.ROW_BLAST;

        if (specialCreated !== TileSpecial.NONE) {
          let targetTile = group.tiles[0];
          // Try to place special tile at interaction point
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

        // Trigger existing specials in chain
        group.tiles.forEach(t => {
           if (t.special && t.special !== TileSpecial.NONE) {
               const effects = triggerSpecialEffect(currentBoard, t);
               effects.forEach(eff => tilesToRemove.add(eff.id));
           }
        });
      });

      onScore(Math.floor(totalPoints));

      // 1. Mark Matched (Visual)
      const matchedBoard = newBoard.map(row => row.map(t => {
        const shouldRemove = tilesToRemove.has(t.id);
        if (shouldRemove) return { ...t, isMatched: true };
        return t;
      }));
      
      setBoard(matchedBoard);
      boardRef.current = matchedBoard;

      // 2. Clear & Refill (Delayed)
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

        // Refill logic relies on current config colors, but we need to access them safely
        // Since levelConfig changes rarely, passing it via closure is usually fine, 
        // but to be strictly stable we'd use a ref. For now, assuming levelConfig is stable enough for the recursion.
        const refilledBoard = refillBoard(clearedBoard, levelConfig.colors);
        setBoard(refilledBoard);
        boardRef.current = refilledBoard;
        
        processingTimeout.current = setTimeout(() => {
          processBoardLogic(refilledBoard, false);
        }, ANIMATION_DELAY);
      }, ANIMATION_DELAY);

    } else {
      processingRef.current = false;
    }
  }, [levelConfig.colors, onScore]);

  const performSwapLogic = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const currentBoard = boardRef.current;
    
    // Create new board state
    const newBoard = currentBoard.map(row => [...row]);
    const t1 = newBoard[y1][x1];
    const t2 = newBoard[y2][x2];

    const temp = {...t1};
    newBoard[y1][x1] = {...t2, x: x1, y: y1};
    newBoard[y2][x2] = {...temp, x: x2, y: y2};

    // Update UI immediately
    setBoard(newBoard);
    boardRef.current = newBoard;
    setSelectedTile(null);
    processingRef.current = true;

    // Check Matches
    setTimeout(() => {
      const groups = findMatchGroups(newBoard);
      const isSpecialTrigger = (t1.special === TileSpecial.COLOR_BOMB || t2.special === TileSpecial.COLOR_BOMB);

      if (groups.length > 0 || isSpecialTrigger) {
         processBoardLogic(newBoard, true, {x1, y1, x2, y2});
      } else {
        // Invalid Move: Revert
        const revertedBoard = newBoard.map(row => [...row]);
        const r1 = revertedBoard[y1][x1];
        const r2 = revertedBoard[y2][x2];
        revertedBoard[y1][x1] = {...r2, x: x1, y: y1};
        revertedBoard[y2][x2] = {...r1, x: x2, y: y2};
        
        setBoard(revertedBoard);
        boardRef.current = revertedBoard;
        processingRef.current = false;
      }
    }, 150);
  }, [processBoardLogic]);

  // --- STABLE HANDLERS (No Dependencies) ---
  // These functions are created ONCE. They use Refs to read state.

  const handleTileClickStable = useCallback((x: number, y: number) => {
    if (!gameActiveRef.current || processingRef.current) return;

    const currentBoard = boardRef.current;
    const powerUp = activePowerUpRef.current;

    // PowerUp Logic
    if (powerUp) {
      processingRef.current = true;
      const targets = applyPowerUp(currentBoard, powerUp, x, y);
      
      const newBoard = currentBoard.map(row => [...row]);
      targets.forEach(t => { newBoard[t.y][t.x].isMatched = true; });
      
      setBoard(newBoard);
      boardRef.current = newBoard;
      onPowerUpUsed();

      processingTimeout.current = setTimeout(() => {
        const clearedBoard = newBoard.map(row => row.map(t => 
           t.isMatched ? { ...t, type: TileType.EMPTY, isMatched: false, special: TileSpecial.NONE } : t
        ));
        const refilled = refillBoard(clearedBoard, levelConfig.colors); // Note: Closure capture of levelConfig here is acceptable as levels don't change mid-click usually
        setBoard(refilled);
        boardRef.current = refilled;
        setTimeout(() => processBoardLogic(refilled, false), ANIMATION_DELAY);
      }, ANIMATION_DELAY);
      return;
    }

    // Standard Swap Logic
    // We need to read the *latest* selectedTile from state. 
    // Since useState is async, we can't easily ref it without another useEffect.
    // Instead, we can use the Functional Update of setState to access prev, but that doesn't help logic.
    // Hack: We can just use the closure `selectedTile` if we accept `selectedTile` as a dependency.
    // BUT to keep it stable, let's use a setState callback pattern or just rely on React's event batching.
    // BETTER: Use the state directly, but only add `selectedTile` as dependency.
    // To fix the "lag", the key is that *TileComponent* props shouldn't change.
    
    // We will handle the selection state update via the parent wrapper
    // The TileComponent calls this with (x,y).
    
    setSelectedTile(prev => {
      if (!prev) return { x, y };
      if (prev.x === x && prev.y === y) return null; // Deselect
      
      const dist = Math.abs(prev.x - x) + Math.abs(prev.y - y);
      if (dist === 1) {
        performSwapLogic(prev.x, prev.y, x, y);
        return null; // Clear selection after swap
      }
      return { x, y }; // Change selection
    });

  }, [levelConfig.colors, onPowerUpUsed, processBoardLogic, performSwapLogic]);

  const handlePointerDownStable = useCallback((e: React.PointerEvent, x: number, y: number) => {
    if (!gameActiveRef.current || processingRef.current || activePowerUpRef.current) return;
    if (e.button !== 0) return;
    
    // Crucial for mobile: Prevent browser scrolling/gestures
    const target = e.target as Element;
    if (target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
    }
    
    dragStartRef.current = { tileX: x, tileY: y, clientX: e.clientX, clientY: e.clientY };
  }, []);

  const handleGlobalPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current || processingRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    const threshold = 10; // Sensitivity
    
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      const { tileX, tileY } = dragStartRef.current;
      let targetX = tileX;
      let targetY = tileY;
      
      if (Math.abs(dx) > Math.abs(dy)) targetX += dx > 0 ? 1 : -1;
      else targetY += dy > 0 ? 1 : -1;
      
      if (targetX >= 0 && targetX < BOARD_SIZE && targetY >= 0 && targetY < BOARD_SIZE) {
        performSwapLogic(tileX, tileY, targetX, targetY);
      }
      dragStartRef.current = null; // Stop dragging immediately after trigger
    }
  }, [performSwapLogic]);

  const handleGlobalPointerUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  return (
    <div 
      className="relative bg-slate-800 rounded shadow-sm border border-slate-700 overflow-hidden game-board-container"
      style={{ 
        width: '100%', 
        maxWidth: '500px', 
        aspectRatio: '1/1', 
        contain: 'strict',
        touchAction: 'none' // CRITICAL: Disables browser gestures on the board
      }}
      onPointerMove={handleGlobalPointerMove}
      onPointerUp={handleGlobalPointerUp}
      onPointerLeave={handleGlobalPointerUp}
    >
      {board.flat().map((tile) => (
        <TileComponent
          key={tile.id}
          tile={tile}
          isSelected={selectedTile?.x === tile.x && selectedTile?.y === tile.y}
          onClick={handleTileClickStable}
          onPointerDown={handlePointerDownStable}
        />
      ))}
    </div>
  );
};

export const GameBoard = React.memo(GameBoardBase);