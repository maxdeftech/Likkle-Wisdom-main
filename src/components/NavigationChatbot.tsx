
import React, { useState, useRef, useEffect } from 'react';
import { CHATBOT_KNOWLEDGE, FALLBACK_RESPONSE } from '../data/chatbot_knowledge';

interface Message {
    id: string;
    text: string;
    sender: 'ai' | 'user';
    action?: {
        type: 'tab' | 'view' | 'setting' | 'external';
        value: string;
    };
}

interface NavigationChatbotProps {
    onNavigate: (type: 'tab' | 'view' | 'setting' | 'external', value: string) => void;
}

const NavigationChatbot: React.FC<NavigationChatbotProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hail! I'm Likkle Guide. What yuh lookin' for inna di app today?\n\nTap a topic below or ask me anything:",
            sender: 'ai'
        }
    ]);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // TTS: Speak a message (guarded for platforms without speechSynthesis, e.g. Android WebView)
    const speakText = (text: string, msgId: string) => {
        const synth = typeof window !== 'undefined' ? (window as any).speechSynthesis : null;
        if (!synth || typeof synth.cancel !== 'function' || typeof synth.speak !== 'function') return;

        synth.cancel();
        if (speakingId === msgId) { setSpeakingId(null); return; }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        setSpeakingId(msgId);
        synth.speak(utterance);
    };

    // STT: Start/stop speech recognition
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Speech recognition not supported in this browser.'); return; }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

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

    // Cleanup TTS on close
    useEffect(() => {
        if (!isOpen) {
            const synth = typeof window !== 'undefined' ? (window as any).speechSynthesis : null;
            if (synth && typeof synth.cancel === 'function') {
                synth.cancel();
            }
            setSpeakingId(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Auto-focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            const t1 = setTimeout(() => inputRef.current?.focus(), 50);
            const t2 = setTimeout(() => {
                inputRef.current?.focus();
            }, 150);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [isOpen]);

    // Keyboard Awareness for PWA
    useEffect(() => {
        const handleVisualViewportResize = () => {
            if (window.visualViewport && windowRef.current) {
                const vv = window.visualViewport;
                const offset = window.innerHeight - vv.height;
                // If offset is significant (keyboard is likely open)
                if (offset > 100) {
                    windowRef.current.style.bottom = `${offset + 20}px`;
                    windowRef.current.style.height = '350px'; // Shrink slightly to fit
                } else {
                    windowRef.current.style.bottom = '64px'; // Default bottom-16
                    windowRef.current.style.height = '450px';
                }

                // Ensure scroll to bottom of messages
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }
        };

        window.visualViewport?.addEventListener('resize', handleVisualViewportResize);
        window.visualViewport?.addEventListener('scroll', handleVisualViewportResize);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
            window.visualViewport?.removeEventListener('scroll', handleVisualViewportResize);
        };
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setShowQuickActions(false); // Hide quick actions after user sends first message
        const currentInput = input.toLowerCase();
        setInput('');

        // AI Logic
        setTimeout(() => {
            const match = CHATBOT_KNOWLEDGE.find(k =>
                k.keywords.some(keyword => currentInput.includes(keyword))
            );

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: match ? match.response : FALLBACK_RESPONSE,
                sender: 'ai',
                action: match?.action
            };

            setMessages(prev => [...prev, aiResponse]);
        }, 600);
    };

    const handleActionClick = (action: Message['action']) => {
        if (action) {
            onNavigate(action.type, action.value);
            setIsOpen(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[1000] font-display mb-safe">
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`size-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${isOpen ? 'bg-slate-900 dark:bg-background-dark text-primary rotate-90' : 'bg-primary text-slate-950'}`}
            >
                <span className="material-symbols-outlined text-3xl">
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
            </button>

            {/* Chat Window */}
            <div
                ref={windowRef}
                style={{
                    bottom: '64px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className={`absolute right-0 w-80 h-[450px] glass rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden border border-slate-900/10 dark:border-white/10 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-slate-950">
                            <span className="material-symbols-outlined text-2xl">support_agent</span>
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest leading-none">Likkle Guide</h3>
                            <span className="text-[9px] text-primary font-bold uppercase tracking-widest animate-pulse">Online fi help</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
                >
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-medium leading-relaxed ${msg.sender === 'user'
                                ? 'bg-primary text-slate-950 rounded-tr-none shadow-lg'
                                : 'bg-slate-900/5 dark:bg-white/5 text-slate-900/90 dark:text-white/90 rounded-tl-none border border-slate-900/5 dark:border-white/5'
                                }`}>
                                {msg.text}
                                {msg.sender === 'ai' && (
                                    <button
                                        onClick={() => speakText(msg.text, msg.id)}
                                        className={`mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${speakingId === msg.id ? 'text-primary' : 'text-slate-900/30 dark:text-white/30 hover:text-primary/70'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{speakingId === msg.id ? 'stop_circle' : 'volume_up'}</span>
                                        {speakingId === msg.id ? 'Stop' : 'Listen'}
                                    </button>
                                )}
                                {msg.action && (
                                    <button
                                        onClick={() => handleActionClick(msg.action)}
                                        className="mt-3 w-full bg-[#13ec5b] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 shadow-emerald-500/20"
                                    >
                                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                        Take me deh
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Quick Action Buttons */}
                    {showQuickActions && messages.length === 1 && (
                        <div className="grid grid-cols-2 gap-2 mt-4 animate-fade-in">
                            {[
                                { label: 'About App', icon: 'info', query: 'What is Likkle Wisdom?' },
                                { label: 'Bible', icon: 'menu_book', query: 'Show me the Bible' },
                                { label: 'Feed', icon: 'dynamic_feed', query: 'Take me to Feed' },
                                { label: 'AI Wisdom', icon: 'auto_awesome', query: 'Generate custom wisdom' },
                                { label: 'Journal', icon: 'book', query: 'Open my journal' },
                                { label: 'Messages', icon: 'forum', query: 'Show my messages' },
                                { label: 'Friends', icon: 'group', query: 'See my friends' },
                                { label: 'Settings', icon: 'settings', query: 'Open settings' },
                            ].map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(opt.query);
                                        setShowQuickActions(false);
                                        // Simulate user sending the query
                                        const userMsg: Message = {
                                            id: Date.now().toString(),
                                            text: opt.query,
                                            sender: 'user'
                                        };
                                        setMessages(prev => [...prev, userMsg]);
                                        
                                        // Process response
                                        setTimeout(() => {
                                            const match = CHATBOT_KNOWLEDGE.find(k =>
                                                k.keywords.some(keyword => opt.query.toLowerCase().includes(keyword))
                                            );
                                            const aiResponse: Message = {
                                                id: (Date.now() + 1).toString(),
                                                text: match ? match.response : FALLBACK_RESPONSE,
                                                sender: 'ai',
                                                action: match?.action
                                            };
                                            setMessages(prev => [...prev, aiResponse]);
                                        }, 600);
                                    }}
                                    className="glass rounded-xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-all border border-slate-900/5 dark:border-white/5 hover:border-primary/30"
                                >
                                    <span className="material-symbols-outlined text-primary text-lg">{opt.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-900/60 dark:text-white/60">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-slate-900/5 dark:bg-white/5 border-t border-slate-900/5 dark:border-white/5">
                    <div className="flex gap-2">
                        <button
                            onClick={toggleListening}
                            className={`size-12 shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'glass text-slate-900/60 dark:text-white/40'}`}
                            title={isListening ? 'Stop listening' : 'Voice input'}
                        >
                            <span className="material-symbols-outlined text-xl">{isListening ? 'mic_off' : 'mic'}</span>
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            onFocus={() => {
                                setTimeout(() => {
                                    windowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                }, 300);
                            }}
                            placeholder={isListening ? "Listening..." : "Ask 'bout di Bible, upgrade..."}
                            inputMode="text"
                            enterKeyHint="send"
                            autoComplete="off"
                            className="flex-1 bg-white/5 dark:bg-slate-900/5 border border-slate-900/10 dark:border-white/10 rounded-2xl h-12 px-4 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-900/40 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all"
                        />
                        <button
                            onClick={handleSend}
                            className="size-12 shrink-0 rounded-2xl bg-primary text-slate-950 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationChatbot;
