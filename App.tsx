
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, MessageSender, BlindSpot, GroundingSource, CoachPersonality, SavedDebate } from './types';
import { debateCoachService } from './services/geminiService';
import Header from './components/Header';
import BlindSpotAlert from './components/BlindSpotAlert';
import NewTopicModal from './components/NewTopicModal';
import StatsOverlay from './components/StatsOverlay';
import LogDrawer from './components/LogDrawer';

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

const App: React.FC = () => {
  const [topic, setTopic] = useState("Universal Basic Income");
  const [personality, setPersonality] = useState<CoachPersonality>('Socratic');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: MessageSender.AI,
      text: "Consider the economic implications of inflation. Introducing a universal stipend without corresponding production increases could devalue currency. How do you account for supply-side constraints?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<SavedDebate[]>([]);
  
  const [logicScore, setLogicScore] = useState(50);
  const [fallacies, setFallacies] = useState<Record<string, number>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load logs on mount
  useEffect(() => {
    const saved = localStorage.getItem('duothink_logs');
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (e: any) => {
        setInputValue(prev => prev + " " + e.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handlePlayAudio = async (messageId: string, text: string) => {
    if (isAudioLoading) return;
    setIsAudioLoading(messageId);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const base64 = await debateCoachService.generateSpeech(text);
      const audioData = decodeBase64(base64);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: true } : m));
      source.onended = () => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
      };
      source.start();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAudioLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: MessageSender.USER,
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    try {
      const { retort, blindSpot, logicScore: newScore, sources } = await debateCoachService.getResponse(topic, [...messages, userMessage], personality);
      setLogicScore(prev => Math.round((prev * 0.4) + (newScore * 0.6)));
      setMessages(prev => {
        const next = [...prev];
        if (blindSpot.detected) {
          setFallacies(f => ({ ...f, [blindSpot.type]: (f[blindSpot.type] || 0) + 1 }));
          next.push({ id: `alert-${Date.now()}`, sender: MessageSender.SYSTEM_ALERT, text: "", timestamp: "", blindSpot });
        }
        next.push({
          id: `ai-${Date.now()}`,
          sender: MessageSender.AI,
          text: retort,
          sources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        return next;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const archiveCurrentDebate = () => {
    if (messages.length <= 1) return;
    const newLog: SavedDebate = {
      id: Date.now().toString(),
      topic,
      date: new Date().toLocaleDateString(),
      messages,
      score: logicScore
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem('duothink_logs', JSON.stringify(updated));
  };

  const startNewDebate = (newTopic: string) => {
    archiveCurrentDebate();
    setTopic(newTopic);
    setLogicScore(50);
    setFallacies({});
    setMessages([{
      id: '1',
      sender: MessageSender.AI,
      text: `Opening debate: ${newTopic}. I'm ready for your opening statement.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setIsModalOpen(false);
  };

  const loadDebate = (debate: SavedDebate) => {
    setTopic(debate.topic);
    setMessages(debate.messages);
    setLogicScore(debate.score);
    setIsLogsOpen(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 font-display">
      <Header 
        topic={topic} 
        personality={personality} 
        onPersonalityChange={setPersonality}
        onBack={() => setIsLogsOpen(true)}
      />
      
      <NewTopicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={startNewDebate} />
      <StatsOverlay isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} score={logicScore} fallacies={fallacies} />
      <LogDrawer isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} logs={logs} onSelect={loadDebate} />

      <main className="flex-1 overflow-y-auto px-4 pt-12 pb-40 relative flex flex-col gap-6">
        {messages.map((msg) => {
          if (msg.sender === MessageSender.SYSTEM_ALERT && msg.blindSpot) {
            return <BlindSpotAlert key={msg.id} blindSpot={msg.blindSpot} />;
          }
          const isUser = msg.sender === MessageSender.USER;
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end pl-8' : 'pr-4'}`}>
              <div className={`flex flex-col ${isUser ? 'items-end' : 'gap-1 w-full max-w-4xl'}`}>
                {!isUser && (
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">DuoThink Coach ({personality})</span>
                    </div>
                    <button onClick={() => handlePlayAudio(msg.id, msg.text)} className={`size-7 rounded-full flex items-center justify-center transition-all ${msg.isAudioPlaying ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                      <span className="material-symbols-outlined text-sm">{isAudioLoading === msg.id ? 'sync' : msg.isAudioPlaying ? 'equalizer' : 'volume_up'}</span>
                    </button>
                  </div>
                )}
                <div className={`transition-all duration-300 relative ${isUser ? 'bg-primary text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-xl' : 'pl-5 border-l-2 border-primary/40 py-1'}`}>
                  <p className="text-[15px] leading-relaxed font-normal tracking-wide">{msg.text}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {msg.sources.slice(0, 3).map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md text-[10px] text-primary-200">
                          <span className="material-symbols-outlined text-[12px]">link</span>
                          <span className="truncate max-w-[120px]">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] text-gray-600 mt-1 font-medium ${isUser ? 'pr-1' : 'pl-5'}`}>{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </main>

      <div className="fixed bottom-0 left-0 w-full z-40 pb-safe">
        <div className="px-4 pb-3">
          <div className="bg-charcoal-dark/90 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl p-2 flex items-center gap-2">
            <button onClick={() => { setIsListening(true); recognitionRef.current?.start(); }} className={`shrink-0 size-11 flex items-center justify-center rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-gray-400'}`}>
              <span className="material-symbols-outlined text-2xl">{isListening ? 'mic' : 'mic_none'}</span>
            </button>
            <button onClick={async () => { setHint(await debateCoachService.getHint(topic, messages, personality)); setTimeout(() => setHint(null), 8000); }} className="shrink-0 size-11 flex items-center justify-center rounded-xl bg-slate-800 text-amber-alert hover:bg-slate-700 border border-white/5 group">
              <span className="material-symbols-outlined text-2xl group-hover:rotate-12">lightbulb</span>
            </button>
            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm px-2 py-3 border-0 outline-none" placeholder={isListening ? "Listening..." : "Counter their argument..."} />
            <button onClick={handleSendMessage} disabled={isTyping || !inputValue.trim()} className="shrink-0 size-11 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg disabled:opacity-30">
              <span className="material-symbols-outlined text-2xl">keyboard_arrow_up</span>
            </button>
          </div>
        </div>
        <nav className="bg-charcoal-dark/95 border-t border-white/5 pt-3 pb-8 px-8 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <button className="flex flex-col items-center gap-1.5 p-1 text-primary"><span className="material-symbols-outlined text-2xl">forum</span><span>Debate</span></button>
          <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center gap-1.5 p-1 hover:text-white"><span className="material-symbols-outlined text-2xl">add_circle</span><span>New</span></button>
          <button onClick={() => setIsLogsOpen(true)} className="flex flex-col items-center gap-1.5 p-1 hover:text-white"><span className="material-symbols-outlined text-2xl">history_edu</span><span>Logs</span></button>
          <button onClick={() => setIsStatsOpen(true)} className={`flex flex-col items-center gap-1.5 p-1 transition-all ${isStatsOpen ? 'text-primary' : 'hover:text-white'}`}><span className="material-symbols-outlined text-2xl">monitoring</span><span>Stats</span></button>
        </nav>
      </div>
      
      {hint && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm px-5 py-4 bg-primary/95 text-white rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl animate-in slide-in-from-top-12">
          <div className="flex gap-3 items-start">
            <span className="material-symbols-outlined text-amber-alert">lightbulb</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary-200 opacity-60 mb-0.5">Coach Hint</span>
              <p className="text-sm font-medium leading-tight">{hint}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
