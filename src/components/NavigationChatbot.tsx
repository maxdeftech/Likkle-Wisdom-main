
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
            text: "Hail! I'm Likkle Guide. What yuh lookin' for inna di app today?",
            sender: 'ai'
        }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);

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
        <div className="fixed bottom-24 right-6 z-[1000] font-display">
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
                                {msg.action && (
                                    <button
                                        onClick={() => handleActionClick(msg.action)}
                                        className="mt-3 w-full bg-primary/20 border border-primary/30 text-primary py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                        Take me deh
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 bg-slate-900/5 dark:bg-white/5 border-t border-slate-900/5 dark:border-white/5">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            autoFocus
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            onFocus={() => {
                                // Ensure component handles mobile keyboard push-up correctly
                                setTimeout(() => {
                                    windowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                }, 300);
                            }}
                            placeholder="Ask 'bout di Bible, upgrade..."
                            inputMode="text"
                            enterKeyHint="send"
                            autoComplete="off"
                            className="flex-1 bg-white/5 dark:bg-slate-900/5 border border-slate-900/10 dark:border-white/10 rounded-2xl h-12 px-4 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-900/40 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all"
                        />
                        <button
                            onClick={handleSend}
                            className="size-12 rounded-2xl bg-primary text-slate-950 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
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
