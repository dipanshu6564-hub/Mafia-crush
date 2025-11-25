import React from 'react';
import { Tile, TileType } from '../types';
import { TILE_ICONS, TILE_COLORS, SPECIAL_OVERLAYS } from '../constants';

interface TileProps {
  tile: Tile;
  isSelected: boolean;
  onClick: (x: number, y: number) => void;
  onPointerDown: (e: React.PointerEvent, x: number, y: number) => void;
}

const TileComponentBase: React.FC<TileProps> = ({ tile, isSelected, onClick, onPointerDown }) => {
  if (tile.type === TileType.EMPTY) return null;

  const transformStyle: React.CSSProperties = {
    // Hardware acceleration
    transform: `translate3d(${tile.x * 100}%, ${tile.y * 100}%, 0)`,
    width: '12.5%', 
    height: '12.5%',
    position: 'absolute',
    top: 0,
    left: 0,
    transition: 'transform 0.15s ease-out', 
    zIndex: isSelected ? 50 : 10,
    padding: '3px',
    touchAction: 'none', // Critical for mobile
  };

  const colorClass = TILE_COLORS[tile.type] || 'text-white';
  const specialOverlay = tile.special ? SPECIAL_OVERLAYS[tile.special] : null;
  
  return (
    <div
      onClick={() => onClick(tile.x, tile.y)}
      onPointerDown={(e) => onPointerDown(e, tile.x, tile.y)}
      style={transformStyle}
      className="touch-none select-none"
    >
      <div className={`
        relative w-full h-full rounded flex items-center justify-center
        transition-opacity duration-150
        ${isSelected ? 'bg-slate-500' : 'bg-slate-700'}
        ${tile.isMatched ? 'opacity-0' : 'opacity-100'} 
      `}>
        {/* Background Icon */}
        <div className={`w-3/4 h-3/4 ${colorClass} pointer-events-none`}>
          {TILE_ICONS[tile.type]}
        </div>

        {/* Special Powerup Overlay */}
        {specialOverlay}
      </div>
    </div>
  );
};

export const TileComponent = React.memo(TileComponentBase, (prev, next) => {
  // STRICT COMPARISON
  // We assume onClick and onPointerDown are stable references from the parent
  // So we only check the data that actually changes visuals.
  return (
    prev.tile.id === next.tile.id &&
    prev.tile.type === next.tile.type &&
    prev.tile.isMatched === next.tile.isMatched &&
    prev.tile.x === next.tile.x && 
    prev.tile.y === next.tile.y &&
    prev.tile.special === next.tile.special &&
    prev.isSelected === next.isSelected
  );
});