import { Board, Tile, TileType, LevelConfig, PowerUpType, TileSpecial } from '../types';
import { BOARD_SIZE } from '../constants';

// Simple ID counter for performance (faster than Date.now() + Math.random())
let idCounter = 0;
const generateId = () => `t_${++idCounter}`;

export const generateLevelConfig = (levelNum: number): LevelConfig => {
  const allTypes = [
    TileType.PISTOL, TileType.HAT, TileType.CASH, 
    TileType.CIGAR, TileType.GEM, TileType.KNUCKLES
  ];
  
  let colorCount = 4;
  if (levelNum > 2) colorCount = 5;
  if (levelNum >= 10) colorCount = 6;

  const levelColors = allTypes.slice(0, colorCount);
  const targetScore = 5000 + (levelNum * 1000); 

  return {
    levelNumber: levelNum,
    targetScore,
    timerSeconds: 300, 
    colors: levelColors
  };
};

const getRandomType = (colors: TileType[]) => colors[Math.floor(Math.random() * colors.length)];

export const createBoard = (colors: TileType[]): Board => {
  const board: Board = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      let type = getRandomType(colors);
      while (
        (x >= 2 && row[x - 1].type === type && row[x - 2].type === type) ||
        (y >= 2 && board[y - 1][x].type === type && board[y - 2][x].type === type)
      ) {
        type = getRandomType(colors);
      }
      row.push({
        id: generateId(),
        type,
        x,
        y,
        special: TileSpecial.NONE
      });
    }
    board.push(row);
  }
  return board;
};

export interface MatchGroup {
  tiles: Tile[];
  type: 'horizontal' | 'vertical';
}

export const findMatchGroups = (board: Board): MatchGroup[] => {
  const groups: MatchGroup[] = [];
  // Horizontal
  for (let y = 0; y < BOARD_SIZE; y++) {
    let matchLength = 1;
    for (let x = 0; x < BOARD_SIZE; x++) {
      const isLast = x === BOARD_SIZE - 1;
      const current = board[y][x];
      const next = !isLast ? board[y][x + 1] : null;

      if (next && current.type !== TileType.EMPTY && current.type === next.type) {
        matchLength++;
      } else {
        if (matchLength >= 3) {
          const tiles: Tile[] = [];
          for (let k = 0; k < matchLength; k++) tiles.push(board[y][x - k]);
          groups.push({ tiles, type: 'horizontal' });
        }
        matchLength = 1;
      }
    }
  }
  // Vertical
  for (let x = 0; x < BOARD_SIZE; x++) {
    let matchLength = 1;
    for (let y = 0; y < BOARD_SIZE; y++) {
      const isLast = y === BOARD_SIZE - 1;
      const current = board[y][x];
      const next = !isLast ? board[y + 1][x] : null;

      if (next && current.type !== TileType.EMPTY && current.type === next.type) {
        matchLength++;
      } else {
        if (matchLength >= 3) {
          const tiles: Tile[] = [];
          for (let k = 0; k < matchLength; k++) tiles.push(board[y - k][x]);
          groups.push({ tiles, type: 'vertical' });
        }
        matchLength = 1;
      }
    }
  }
  return groups;
};

export const triggerSpecialEffect = (board: Board, tile: Tile): Tile[] => {
  const tilesToRemove: Tile[] = [];
  if (!tile.special || tile.special === TileSpecial.NONE) return tilesToRemove;

  if (tile.special === TileSpecial.ROW_BLAST) {
    for(let x=0; x<BOARD_SIZE; x++) tilesToRemove.push(board[tile.y][x]);
  } 
  else if (tile.special === TileSpecial.COLOR_BOMB) {
     const targetType = tile.type;
     for(let y=0; y<BOARD_SIZE; y++){
      for(let x=0; x<BOARD_SIZE; x++){
        if(board[y][x].type === targetType) tilesToRemove.push(board[y][x]);
      }
    }
  }
  return tilesToRemove;
};

export const applyPowerUp = (
  board: Board, 
  powerUp: PowerUpType, 
  targetX: number, 
  targetY: number
): Tile[] => {
  const tilesToRemove = new Set<Tile>();
  if (powerUp === PowerUpType.GUN) {
    for(let x=0; x<BOARD_SIZE; x++) tilesToRemove.add(board[targetY][x]);
  } 
  else if (powerUp === PowerUpType.BOMB) {
    for(let dy=-1; dy<=1; dy++){
      for(let dx=-1; dx<=1; dx++){
        const ny = targetY+dy;
        const nx = targetX+dx;
        if(ny >=0 && ny < BOARD_SIZE && nx >=0 && nx < BOARD_SIZE) {
          tilesToRemove.add(board[ny][nx]);
        }
      }
    }
  }
  else if (powerUp === PowerUpType.FLAME) {
    for(let x=0; x<BOARD_SIZE; x++) tilesToRemove.add(board[targetY][x]);
    for(let y=0; y<BOARD_SIZE; y++) tilesToRemove.add(board[y][targetX]);
  }
  else if (powerUp === PowerUpType.DON) {
    const targetType = board[targetY][targetX].type;
    for(let y=0; y<BOARD_SIZE; y++){
      for(let x=0; x<BOARD_SIZE; x++){
        if(board[y][x].type === targetType) tilesToRemove.add(board[y][x]);
      }
    }
  }
  return Array.from(tilesToRemove);
};

export const refillBoard = (board: Board, colors: TileType[]): Board => {
  const newBoard = board.map(row => [...row]); 

  for (let x = 0; x < BOARD_SIZE; x++) {
    let emptySlots = 0;
    for (let y = BOARD_SIZE - 1; y >= 0; y--) {
      if (newBoard[y][x].type === TileType.EMPTY) {
        emptySlots++;
      } else if (emptySlots > 0) {
        const tileToMove = newBoard[y][x];
        newBoard[y + emptySlots][x] = { ...tileToMove, x: x, y: y + emptySlots };
        newBoard[y][x] = { ...newBoard[y][x], type: TileType.EMPTY, special: TileSpecial.NONE };
      }
    }

    for (let y = 0; y < emptySlots; y++) {
      newBoard[y][x] = {
        id: generateId(),
        type: getRandomType(colors),
        x,
        y,
        special: TileSpecial.NONE
      };
    }
  }
  return newBoard;
};