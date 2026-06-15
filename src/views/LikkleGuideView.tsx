
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamChatWithGuide } from '../services/geminiService';
import TravelMarkdown from '../components/travel/TravelMarkdown';
import { Tab } from '../types';

interface GuideMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'lw_guide_messages';

const loadMessages = (): GuideMessage[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveMessages = (msgs: GuideMessage[]) => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch {}
};

interface LikkleGuideViewProps {
  onTabChange: (tab: Tab) => void;
}

const LikkleGuideView: React.FC<LikkleGuideViewProps> = ({ onTabChange }) => {
  const [messages, setMessages] = useState<GuideMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll — throttle during streaming to avoid jank
  const lastScrollRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastScrollRef.current < 80 && streamingText) return;
    lastScrollRef.current = now;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamingText]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: GuideMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      const history = updated.map(m => ({ role: m.role, content: m.content }));
      const fullResponse = await streamChatWithGuide(history, (partial) => {
        setStreamingText(partial);
      });

      const assistantMsg: GuideMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: GuideMessage = {
        id: `e_${Date.now()}`,
        role: 'assistant',
        content: "Hmm, something went wrong. Try again inna likkle bit.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const speakText = (text: string, msgId: string) => {
    const synth = typeof window !== 'undefined' ? (window as any).speechSynthesis : null;
    if (!synth || typeof synth.cancel !== 'function') return;
    synth.cancel();
    if (speakingId === msgId) { setSpeakingId(null); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    synth.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const quickTopics = [
    { label: 'App Features', prompt: 'What are all the features in Likkle Wisdom?' },
    { label: 'Travel Tips', prompt: 'Give me top travel tips for visiting Jamaica' },
    { label: 'Trip Planning', prompt: 'How do I use the Trip Planner in the app?' },
    { label: 'Budget Help', prompt: 'Help me plan a budget for a Jamaica trip' },
    { label: 'Patois Phrases', prompt: 'Teach me some essential Jamaican Patois phrases' },
    { label: 'Best Beaches', prompt: 'What are the best beaches in Jamaica?' },
  ];

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/20 backdrop-blur-xl">
        <button
          onClick={() => onTabChange('home')}
          className="size-10 rounded-full glass flex items-center justify-center text-slate-500 dark:text-white/70 hover:text-primary transition-colors"
          aria-label="Back to Home"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="size-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wide truncate">Likkle Guide</h1>
            <p className="text-slate-400 dark:text-white/40 text-[10px] font-bold tracking-wider">AI Assistant &amp; Jamaica Travel Guide</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="size-10 rounded-full glass flex items-center justify-center text-slate-400 dark:text-white/50 hover:text-red-400 transition-colors"
          aria-label="Clear chat"
          title="Clear chat"
        >
          <span className="material-symbols-outlined text-lg">delete_sweep</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">smart_toy</span>
            </div>
            <h2 className="text-slate-900 dark:text-white font-black text-lg mb-1">Welcome to Likkle Guide</h2>
            <p className="text-slate-500 dark:text-white/50 text-sm max-w-xs mb-6">
              Ask me anything about the app or Jamaica travel. Mi deh yah fi help!
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {quickTopics.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => sendMessage(topic.prompt)}
                  className="glass rounded-xl px-3 py-2.5 text-left border border-slate-200 dark:border-white/10 hover:border-primary/30 transition-colors group"
                >
                  <span className="text-slate-700 dark:text-white/80 text-xs font-semibold group-hover:text-primary transition-colors">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={msg.role === 'user' ? 'max-w-[85%]' : 'max-w-[95%] w-full'}>
              {msg.role === 'user' ? (
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-primary/20 text-slate-900 dark:text-white border border-primary/20 rounded-br-md">
                  {msg.content}
                </div>
              ) : (
                <div className="travel-md rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-4 shadow-inner dark:from-primary/8">
                  <TravelMarkdown>{msg.content}</TravelMarkdown>
                </div>
              )}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mt-1.5 ml-1">
                  <button
                    onClick={() => speakText(msg.content, msg.id)}
                    className="size-7 rounded-full flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-primary transition-colors"
                    aria-label={speakingId === msg.id ? 'Stop speaking' : 'Read aloud'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {speakingId === msg.id ? 'stop_circle' : 'volume_up'}
                    </span>
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(msg.content)}
                    className="size-7 rounded-full flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-primary transition-colors"
                    aria-label="Copy message"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming response — shows tokens as they arrive */}
        {isLoading && streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[95%] w-full">
              <div className="travel-md rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-4 shadow-inner dark:from-primary/8">
                <TravelMarkdown>{streamingText}</TravelMarkdown>
                <span className="inline-block size-2 bg-primary rounded-full animate-pulse ml-1 align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* Initial loading dots before first token arrives */}
        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="size-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-slate-400 dark:text-white/40 text-xs">Likkle Guide thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/20 backdrop-blur-xl pb-safe">
        <div className="flex items-end gap-2">
          <button
            onClick={toggleListening}
            className={`size-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'glass text-slate-400 dark:text-white/50 hover:text-primary border border-slate-200 dark:border-white/10'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
          >
            <span className="material-symbols-outlined text-lg">{isListening ? 'mic_off' : 'mic'}</span>
          </button>
          <div className="flex-1 glass rounded-2xl border border-slate-200 dark:border-white/10 focus-within:border-primary/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Likkle Guide..."
              rows={1}
              className="w-full bg-transparent text-slate-900 dark:text-white text-sm px-4 py-2.5 resize-none outline-none placeholder:text-slate-400 dark:placeholder:text-white/30 max-h-24"
              style={{ minHeight: '40px' }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={`size-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? 'bg-primary text-background-dark shadow-lg shadow-primary/30 active:scale-90'
                : 'glass text-slate-300 dark:text-white/20 border border-slate-200 dark:border-white/10'
            }`}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LikkleGuideView;
