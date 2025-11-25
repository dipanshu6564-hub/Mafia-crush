import React from 'react';
import { TileType, PowerUpType, TileSpecial } from './types';

export const BOARD_SIZE = 8;
export const ANIMATION_DELAY = 220; // Slightly higher than CSS transition (200ms)
export const TIMER_DURATION = 300; 

export const TILE_COLORS: Record<TileType, string> = {
  [TileType.PISTOL]: 'text-red-600',
  [TileType.HAT]: 'text-gray-900',
  [TileType.CASH]: 'text-green-600',
  [TileType.CIGAR]: 'text-amber-700',
  [TileType.GEM]: 'text-blue-500',
  [TileType.KNUCKLES]: 'text-yellow-500',
  [TileType.EMPTY]: 'transparent',
};

// Icons for the base tiles
export const TILE_ICONS: Record<TileType, React.ReactNode> = {
  [TileType.PISTOL]: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      <path d="M7 11l-2 2v6h5v-2h2v-2h4v-3h3v-2H7v1z" />
    </svg>
  ),
  [TileType.HAT]: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M5 16h14v2H5zm14-5.5c0-2.5-2-4.5-4.5-4.5h-5c-2.5 0-4.5 2-4.5 4.5v3.5h14v-3.5z" />
    </svg>
  ),
  [TileType.CASH]: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
       <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
    </svg>
  ),
  [TileType.CIGAR]: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20 12l-2-2-12 12 2 2 12-12zM6 18l2-2 2 2-2 2-2-2zm-4 4l2-2 2 2-2 2-2-2z" />
      <circle cx="18" cy="8" r="1.5" />
    </svg>
  ),
  [TileType.GEM]: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M11.5 22.5L3 14l5-10h8l5 10-8.5 8.5zM6.5 13L12 19l5.5-6H6.5z"/>
    </svg>
  ),
  [TileType.KNUCKLES]: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M2 11h20v2H2zm2 4h16v2H4zm-2-8h20v2H2z" />
      <circle cx="6" cy="12" r="1"/>
      <circle cx="10" cy="12" r="1"/>
      <circle cx="14" cy="12" r="1"/>
      <circle cx="18" cy="12" r="1"/>
    </svg>
  ),
  [TileType.EMPTY]: <div />,
};

// Overlays for Special Combo Blocks
export const SPECIAL_OVERLAYS: Record<TileSpecial, React.ReactNode> = {
  [TileSpecial.NONE]: null,
  [TileSpecial.ROW_BLAST]: (
    <div className="absolute inset-0 flex items-center justify-center animate-pulse z-20">
      <div className="w-full h-1 bg-white shadow-[0_0_10px_#fff]" />
      <div className="absolute bg-black/50 rounded-full p-1">
        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M3 12h18v2H3z" /></svg>
      </div>
    </div>
  ),
  [TileSpecial.COLOR_BOMB]: (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-50"></div>
      <div className="absolute bg-yellow-500 rounded-full p-1 shadow-[0_0_15px_#fbbf24]">
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M12 2l3 6 6 1-4.5 4.5L18 22l-6-3-6 3 1.5-8.5L3 9l6-1z" /></svg>
      </div>
    </div>
  )
};

export const POWERUP_INFO: Record<PowerUpType, { name: string, icon: React.ReactNode, desc: string, color: string }> = {
  [PowerUpType.GUN]: {
    name: "Silencer",
    desc: "Clears a horizontal row.",
    color: "bg-red-600",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3 12h18v2H3z" /></svg>
  },
  [PowerUpType.BOMB]: {
    name: "Time Bomb",
    desc: "Blasts a 3x3 area.",
    color: "bg-gray-800",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><circle cx="12" cy="12" r="8" /></svg>
  },
  [PowerUpType.FLAME]: {
    name: "Molotov",
    desc: "Clears a cross (row & col).",
    color: "bg-orange-600",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2L2 22h20L12 2z" /></svg>
  },
  [PowerUpType.DON]: {
    name: "Don's Order",
    desc: "Clears all matching items.",
    color: "bg-purple-800",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2l3 6 6 1-4.5 4.5L18 22l-6-3-6 3 1.5-8.5L3 9l6-1z" /></svg>
  }
};