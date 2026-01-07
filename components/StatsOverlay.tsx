
import React from 'react';

interface StatsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  fallacies: Record<string, number>;
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({ isOpen, onClose, score, fallacies }) => {
  if (!isOpen) return null;

  // Added explicit types (a: number, b: number) to the reducer to fix the 'unknown' operator error.
  const totalFallacies = Object.values(fallacies).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-full duration-500">
      <header className="flex items-center justify-between p-6 border-b border-white/5">
        <h2 className="text-xl font-bold tracking-tight">Logical Analysis</h2>
        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 max-w-2xl mx-auto w-full">
        {/* Score Section */}
        <div className="text-center space-y-4">
          <div className="relative size-48 mx-auto flex items-center justify-center">
             <svg className="size-full -rotate-90 transform">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={552.92}
                  strokeDashoffset={552.92 - (552.92 * score) / 100}
                  className="text-primary transition-all duration-1000 ease-out"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{score}</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Resilience</span>
             </div>
          </div>
          <p className="text-sm text-gray-400 italic">
            {score > 80 ? "Your arguments are highly structured and resilient." : score > 50 ? "Your logic holds, but there are exploitable gaps." : "Focus on building more evidence-based claims."}
          </p>
        </div>

        {/* Fallacies Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold">Fallacy Breakdown</h3>
            <span className="text-xs font-mono text-amber-alert">{totalFallacies} Detected</span>
          </div>

          {totalFallacies === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center text-gray-500">
              No blind spots detected yet. Keep up the clean logic!
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(fallacies).map(([type, count]) => (
                <div key={type} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-200">{type}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Occurrences</span>
                  </div>
                  <div className="size-8 bg-amber-alert/10 text-amber-alert rounded-lg flex items-center justify-center font-bold text-sm">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Tip */}
        <div className="mt-auto pt-8">
           <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-xs text-primary-200 font-medium leading-relaxed">
                Tip: Try the "Socratic Method" to trap the AI in its own contradictions.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;
