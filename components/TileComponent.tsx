import React from 'react';
import { Tile, TileType } from '../types';
import { TILE_ICONS, TILE_COLORS, SPECIAL_OVERLAYS } from '../constants';

interface TileProps {
  tile: Tile;
  isSelected: boolean;
  onClick: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
}

const TileComponentBase: React.FC<TileProps> = ({ tile, isSelected, onClick, onPointerDown }) => {
  const transformStyle: React.CSSProperties = {
    // Translate3d with Z=0 forces GPU layer promotion
    transform: `translate3d(${tile.x * 100}%, ${tile.y * 100}%, 0)`,
    width: '12.5%', 
    height: '12.5%',
    position: 'absolute',
    top: 0,
    left: 0,
    transition: 'transform 0.2s ease-out', 
    zIndex: isSelected ? 50 : 10,
    padding: '2px',
    willChange: 'transform', // Inform browser of impending change
    backfaceVisibility: 'hidden', // Reduce flickering on mobile
    WebkitBackfaceVisibility: 'hidden'
  };

  if (tile.type === TileType.EMPTY) return null;

  const colorClass = TILE_COLORS[tile.type] || 'text-white';
  const specialOverlay = tile.special ? SPECIAL_OVERLAYS[tile.special] : null;
  
  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={transformStyle}
      className="touch-none select-none"
    >
      <div className={`
        relative w-full h-full rounded-lg flex items-center justify-center
        shadow-inner
        transition-all duration-200
        ${isSelected ? 'bg-white/20 ring-2 ring-yellow-400' : 'bg-slate-700/50 hover:bg-slate-600/50'}
        ${tile.isMatched ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} 
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