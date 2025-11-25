import React from 'react';
import { POWERUP_INFO } from '../constants';
import { PowerUpType } from '../types';

interface Props {
  onSelect: (type: PowerUpType) => void;
}

export const PowerUpSelector: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-slate-800 border-2 border-yellow-600 rounded-xl p-6 w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-yellow-500 text-center mb-2 mafia-font">Don's Tribute</h2>
        <p className="text-slate-300 text-center mb-6">You have survived 50 more jobs. Choose your reward.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.values(PowerUpType) as PowerUpType[]).map((type) => {
            const info = POWERUP_INFO[type];
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className="flex items-center gap-4 p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-yellow-500 rounded-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-full ${info.color} flex items-center justify-center text-white shrink-0`}>
                  {info.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-400">{info.name}</h3>
                  <p className="text-sm text-slate-400">{info.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};