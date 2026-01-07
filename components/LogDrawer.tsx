
import React from 'react';
import { SavedDebate } from '../types';

interface LogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SavedDebate[];
  onSelect: (debate: SavedDebate) => void;
}

const LogDrawer: React.FC<LogDrawerProps> = ({ isOpen, onClose, logs, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-charcoal-dark h-full border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-500">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Debate Logs</h2>
          <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="p-4 overflow-y-auto h-[calc(100%-80px)] flex flex-col gap-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4 opacity-50">
              <span className="material-symbols-outlined text-6xl">history_edu</span>
              <p className="text-sm font-medium">No archived debates yet.</p>
            </div>
          ) : (
            logs.map((log) => (
              <button
                key={log.id}
                onClick={() => onSelect(log)}
                className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-white/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{log.date}</span>
                  <div className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter">
                    {log.score}%
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-200 group-hover:text-primary transition-colors mb-1 truncate">
                  {log.topic}
                </h3>
                <p className="text-[10px] text-gray-500 uppercase font-medium">
                  {log.messages.length} Exchanges
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogDrawer;
