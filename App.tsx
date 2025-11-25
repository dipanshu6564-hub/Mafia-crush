
import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { PowerUpSelector } from './components/PowerUpSelector';
import { PowerUpType, PlayerState, LevelConfig } from './types';
import { generateLevelConfig } from './services/gameLogic';
import { POWERUP_INFO } from './constants';

const MAX_LEVELS = 30000;

export default function App() {
  // State
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('mafiaCrushState');
    return saved ? JSON.parse(saved) : { 
      unlockedLevel: 1, 
      inventory: { [PowerUpType.GUN]: 0, [PowerUpType.BOMB]: 0, [PowerUpType.FLAME]: 0, [PowerUpType.DON]: 0 } 
    };
  });

  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'WON' | 'LOST' | 'POWERUP_SELECT'>('IDLE');
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [showLevelReward, setShowLevelReward] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('mafiaCrushState', JSON.stringify(playerState));
  }, [playerState]);

  // Level Setup
  const startLevel = (levelNum: number) => {
    const config = generateLevelConfig(levelNum);
    setLevelConfig(config);
    setCurrentLevel(levelNum);
    setScore(0);
    setTimeLeft(config.timerSeconds);
    setGameStatus('PLAYING');
    setActivePowerUp(null);
  };

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameStatus === 'PLAYING' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
             setGameStatus('LOST');
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, timeLeft]);

  // Win Condition Check
  useEffect(() => {
    if (gameStatus === 'PLAYING' && levelConfig && score >= levelConfig.targetScore) {
      setGameStatus('WON');
      
      // Update Unlocks
      if (currentLevel === playerState.unlockedLevel) {
        const nextLevel = Math.min(playerState.unlockedLevel + 1, MAX_LEVELS);
        
        // Check for 50th level reward
        if (currentLevel! % 50 === 0 && currentLevel! > 0) {
            setShowLevelReward(true);
        } else {
             setPlayerState(prev => ({ ...prev, unlockedLevel: nextLevel }));
        }
      }
    }
  }, [score, gameStatus, levelConfig, currentLevel, playerState.unlockedLevel]);

  // Handlers - Memoized to prevent Board re-renders
  const handleScore = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);

  const handlePowerUpUsed = useCallback(() => {
    setActivePowerUp(null);
  }, []);

  const handleGameOver = useCallback((won: boolean) => {
    setGameStatus(won ? 'WON' : 'LOST');
  }, []);

  const handlePowerUpSelect = (type: PowerUpType) => {
    setPlayerState(prev => ({
      ...prev,
      unlockedLevel: prev.unlockedLevel + 1,
      inventory: {
        ...prev.inventory,
        [type]: prev.inventory[type] + 1
      }
    }));
    setShowLevelReward(false);
    setGameStatus('IDLE'); // Go back to menu
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Renders ---

  // Main Menu / Level Select
  if (gameStatus === 'IDLE') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4">
        <header className="mb-8 text-center mt-12">
          <h1 className="text-6xl text-yellow-500 mafia-font mb-2 drop-shadow-lg">MAFIA CRUSH</h1>
          <p className="text-slate-400">Rise through the ranks. 30,000 Jobs.</p>
        </header>

        <div className="w-full max-w-4xl bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl text-white">Select Job</h2>
            <div className="text-yellow-500">Highest Rank: Level {playerState.unlockedLevel}</div>
          </div>
          
          <div className="grid grid-cols-5 md:grid-cols-8 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {Array.from({ length: playerState.unlockedLevel }).map((_, i) => {
              const lvl = playerState.unlockedLevel - i; // Reverse order to show latest first
              return (
                <button
                  key={lvl}
                  onClick={() => startLevel(lvl)}
                  className="aspect-square bg-slate-700 hover:bg-yellow-600 hover:scale-105 hover:border-yellow-400 rounded-lg flex items-center justify-center text-white font-bold transition-all duration-200 border border-slate-600 shadow-sm transform"
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Reward Modal
  if (showLevelReward) {
    return <PowerUpSelector onSelect={handlePowerUpSelect} />;
  }

  // Active Game
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 relative bg-radial-gradient">
      
      {/* HUD */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4 px-4 py-3 bg-slate-800/90 rounded-lg border border-slate-600 shadow-lg text-white">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-widest">Score</span>
          <span className="text-2xl font-bold text-yellow-400">{score} <span className="text-xs text-slate-500">/ {levelConfig?.targetScore}</span></span>
        </div>
        <div className="flex flex-col items-center">
            <h2 className="text-xl mafia-font text-white">Level {currentLevel}</h2>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-widest">Time</span>
          <span className={`text-2xl font-bold font-mono ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Game Board */}
      <GameBoard 
        levelConfig={levelConfig!}
        gameActive={gameStatus === 'PLAYING'}
        activePowerUp={activePowerUp}
        onScore={handleScore}
        onPowerUpUsed={handlePowerUpUsed}
        onGameOver={handleGameOver}
      />

      {/* Power Up Bar */}
      <div className="w-full max-w-lg mt-6 grid grid-cols-4 gap-4">
        {Object.values(PowerUpType).map((type) => {
            const count = playerState.inventory[type];
            const info = POWERUP_INFO[type];
            const isActive = activePowerUp === type;
            return (
                <button 
                    key={type}
                    disabled={count === 0 || gameStatus !== 'PLAYING'}
                    onClick={() => setActivePowerUp(isActive ? null : type)}
                    className={`
                        relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                        ${isActive ? 'bg-yellow-500/20 border-yellow-500' : 'bg-slate-800 border-slate-700'}
                        ${count === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-slate-700 cursor-pointer'}
                    `}
                >
                    <div className={`w-8 h-8 ${info.color} rounded-full flex items-center justify-center text-white mb-1 shadow-sm`}>
                        {info.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-300">{info.name}</span>
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-slate-900">
                        {count}
                    </span>
                </button>
            )
        })}
      </div>

      {/* Pause/Menu Button */}
      <button 
        onClick={() => setGameStatus('IDLE')}
        className="mt-8 text-slate-500 hover:text-white underline text-sm"
      >
        Quit Job (Return to Menu)
      </button>

      {/* Modals */}
      {(gameStatus === 'WON' || gameStatus === 'LOST') && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl transform transition-all scale-100">
              {gameStatus === 'WON' ? (
                  <>
                    <h2 className="text-4xl text-green-500 font-bold mb-4 mafia-font">Job Done</h2>
                    <p className="text-slate-300 mb-6">The territory is yours.</p>
                    <div className="space-y-3">
                        {!showLevelReward && (
                             <button 
                                onClick={() => startLevel(currentLevel! + 1)}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-lg"
                             >
                                Next Job
                             </button>
                        )}
                        <button onClick={() => setGameStatus('IDLE')} className="w-full py-3 bg-slate-700 text-white rounded-lg">Menu</button>
                    </div>
                  </>
              ) : (
                  <>
                    <h2 className="text-4xl text-red-600 font-bold mb-4 mafia-font">Wasted</h2>
                    <p className="text-slate-300 mb-6">You ran out of time.</p>
                    <div className="space-y-3">
                        <button 
                            onClick={() => startLevel(currentLevel!)}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg"
                         >
                            Retry Level
                         </button>
                        <button onClick={() => setGameStatus('IDLE')} className="w-full py-3 bg-slate-700 text-white rounded-lg">Menu</button>
                    </div>
                  </>
              )}
           </div>
        </div>
      )}

    </div>
  );
}
