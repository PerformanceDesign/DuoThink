
import React, { useState } from 'react';

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topic: string) => void;
}

const NewTopicModal: React.FC<NewTopicModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [topic, setTopic] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-charcoal-dark border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Start New Debate</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          Enter a controversial topic or a philosophical proposition to challenge your logic.
        </p>

        <input 
          type="text" 
          autoFocus
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., The ethics of AI sentience..."
          className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white placeholder-gray-500 mb-6 focus:ring-2 focus:ring-primary transition-all"
        />

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-300 font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (topic.trim()) {
                onSubmit(topic.trim());
                setTopic("");
              }
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            Commence
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTopicModal;
