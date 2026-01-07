
import React from 'react';
import { CoachPersonality } from '../types';

interface HeaderProps {
  topic: string;
  personality: CoachPersonality;
  onPersonalityChange: (p: CoachPersonality) => void;
  onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ topic, personality, onPersonalityChange, onBack }) => {
  const personalities: CoachPersonality[] = ['Socratic', 'Aggressive', 'Academic', 'Stoic'];

  return (
    <header className="flex items-center justify-between p-4 bg-charcoal-dark border-b border-gray-800/50 z-20 shadow-md">
      <button 
        onClick={onBack}
        className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>
      
      <div className="flex flex-col items-center flex-1">
        <h1 className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-medium">Debate Topic</h1>
        <h2 className="text-sm font-bold tracking-tight text-white uppercase truncate max-w-[200px]">{topic}</h2>
      </div>

      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
          <span className="text-[10px] font-bold text-primary-200 uppercase tracking-tighter">{personality}</span>
          <span className="material-symbols-outlined text-sm text-gray-500">expand_more</span>
        </button>
        
        <div className="absolute right-0 top-full mt-2 w-40 bg-slate-800 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="p-2 flex flex-col gap-1">
            {personalities.map((p) => (
              <button
                key={p}
                onClick={() => onPersonalityChange(p)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${personality === p ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                {p} Mode
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
