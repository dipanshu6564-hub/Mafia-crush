export enum TileType {
  PISTOL = 'PISTOL',
  HAT = 'HAT',
  CASH = 'CASH',
  CIGAR = 'CIGAR',
  GEM = 'GEM',
  KNUCKLES = 'KNUCKLES',
  EMPTY = 'EMPTY' // Used during processing
}

export enum TileSpecial {
  NONE = 'NONE',
  ROW_BLAST = 'ROW_BLAST',       // Created by Match 4
  COLOR_BOMB = 'COLOR_BOMB'      // Created by Match 5+
}

export type Tile = {
  id: string; // Unique ID for keying
  type: TileType;
  x: number;
  y: number;
  isMatched?: boolean;
  special?: TileSpecial; // New: Tracks if this tile is a combo booster
};

export type Board = Tile[][];

export enum PowerUpType {
  GUN = 'GUN',       // Clears row
  BOMB = 'BOMB',     // Clears 3x3
  FLAME = 'FLAME',   // Clears row + col
  DON = 'DON'        // Clears all of one color
}

export interface PlayerState {
  unlockedLevel: number;
  inventory: Record<PowerUpType, number>;
}

export interface LevelConfig {
  levelNumber: number;
  targetScore: number;
  timerSeconds: number;
  colors: TileType[];
}