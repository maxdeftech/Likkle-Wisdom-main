
import React, { useState, useEffect } from 'react';
import { User, Friendship, ChatMessage } from '../types';
import { SocialService } from '../services/social';
import { MessagingService } from '../services/messaging';
import { supabase } from '../services/supabase';

interface MessagesProps {
    currentUser: User;
    onClose: () => void;
    onOpenProfile: (userId: string) => void;
}

type ViewState = 'inbox' | 'chat' | 'search';

const Messages: React.FC<MessagesProps> = ({ currentUser, onClose, onOpenProfile }) => {
    const [viewState, setViewState] = useState<ViewState>('inbox');
    const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [friendshipStatus, setFriendshipStatus] = useState<'pending' | 'accepted' | 'none'>('none');

    useEffect(() => {
        loadFriends();
        const interval = setInterval(loadFriends, 30000); // Refresh friends list periodically

        // Subscribe to all incoming messages
        const channel = MessagingService.subscribeToMessages(currentUser.id, (msg) => {
            setMessages(prev => [...prev, msg]);
            if (msg.senderId !== activeChatUser?.id) {
                setUnreadCounts(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
            }
        });

        return () => { channel?.unsubscribe(); clearInterval(interval); };
    }, [currentUser.id]);

    useEffect(() => {
        // Load history when entering chat
        if (activeChatUser) {
            MessagingService.getMessages(activeChatUser.id, currentUser.id).then(setMessages);
            setUnreadCounts(prev => ({ ...prev, [activeChatUser.id]: 0 }));
            MessagingService.markAsRead(activeChatUser.id);
            // Check friendship status
            SocialService.getFriendshipStatus(currentUser.id, activeChatUser.id).then(setFriendshipStatus);
        }
    }, [activeChatUser, currentUser.id]);

    const loadFriends = async () => {
        const f = await SocialService.getFriends(currentUser.id);
        setFriends(f);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeChatUser || friendshipStatus === 'pending') return;
        const text = inputText;
        setInputText('');

        try {
            const msg = await MessagingService.sendMessage(currentUser.id, activeChatUser.id, text);
            if (msg) setMessages(prev => [...prev, msg]);
        } catch (e) {
            console.error("Failed to send", e);
        }
    };

    const handleDeleteChat = async (friendshipId: string) => {
        if (!confirm("Are you sure you want to delete this chat?")) return;
        const { error } = await SocialService.deleteFriendship(friendshipId);
        if (!error) {
            setFriends(prev => prev.filter(f => f.id !== friendshipId));
            setViewState('inbox');
            setActiveChatUser(null);
        } else {
            const msg = typeof error === 'string' ? error : error.message;
            alert("Failed to delete chat: " + msg);
        }
    };

    // --- RENDERERS ---

    const renderInbox = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-white/5 relative">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Messages</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setViewState('search')} className="size-10 rounded-full glass flex items-center justify-center text-white/60 active:scale-95 transition-all">
                        <span className="material-symbols-outlined">person_add</span>
                    </button>
                    {/* Inbox close button moved here for better layout */}
                    <button onClick={onClose} className="size-10 rounded-full glass flex items-center justify-center text-white/60 active:scale-95 transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-white/30 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                        <p className="text-xs font-bold uppercase tracking-wider">No friends yet</p>
                        <button onClick={() => setViewState('search')} className="mt-4 text-primary text-xs font-black uppercase underline">Find People</button>
                    </div>
                ) : (
                    friends.map(f => (
                        <div key={f.id} onClick={() => {
                            setActiveChatUser({ id: f.friendId, username: f.friendName, avatarUrl: f.friendAvatar, isGuest: false, isPremium: false }); // Mock full user
                            setViewState('chat');
                        }} className="glass p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer">
                            <div className="relative" onClick={(e) => { e.stopPropagation(); onOpenProfile(f.friendId); }}>
                                <div className="size-12 rounded-full bg-white/10 overflow-hidden">
                                    {f.friendAvatar ? (
                                        <img src={f.friendAvatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                                            {f.friendName[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {/* Online Indicator could go here */}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm truncate">{f.friendName}</h3>
                                <p className="text-white/40 text-xs truncate">Tap to chat with {f.friendName}</p>
                            </div>
                            {unreadCounts[f.friendId] > 0 && (
                                <div className="size-6 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-background-dark font-black text-[10px]">{unreadCounts[f.friendId]}</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderChat = () => (
        <div className="flex flex-col h-full relative">
            <div className="absolute inset-0 jamaica-gradient opacity-5 pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center gap-4 p-4 glass border-b border-white/5 z-10">
                <button onClick={() => setViewState('inbox')} className="text-white/60 p-2 -ml-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex items-center gap-3 flex-1" onClick={() => activeChatUser && onOpenProfile(activeChatUser.id)}>
                    <div className="size-10 rounded-full bg-white/10 overflow-hidden">
                        {activeChatUser?.avatarUrl ? <img src={activeChatUser.avatarUrl} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-white">{activeChatUser?.username[0]}</span>}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">{activeChatUser?.username}</h3>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                            {friendshipStatus === 'pending' ? 'Waiting for Approval' : 'Online'}
                        </p>
                    </div>
                </div>
                {/* Delete Chat Button */}
                {friends.find(f => f.friendId === activeChatUser?.id) && (
                    <button
                        onClick={() => {
                            const friendship = friends.find(f => f.friendId === activeChatUser?.id);
                            if (friendship) handleDeleteChat(friendship.id);
                        }}
                        className="text-red-400/60 p-2 hover:bg-red-400/10 rounded-full transition-colors"
                        title="Delete Chat"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                )}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser.id;
                    const showTime = i === messages.length - 1 || (messages[i + 1] && messages[i + 1].timestamp - msg.timestamp > 300000); // 5 min gap

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${isMe
                                ? 'bg-primary text-background-dark rounded-tr-sm font-medium shadow-lg'
                                : 'glass text-white rounded-tl-sm border border-white/10'
                                }`}>
                                {msg.content}
                            </div>
                            {showTime && (
                                <span className="text-[9px] text-white/20 mt-1 font-bold uppercase tracking-widest">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div id="scroll-anchor"></div>
            </div>

            {/* Input Area */}
            <div className="p-4 glass border-t border-white/5 z-10">
                {friendshipStatus === 'pending' ? (
                    <div className="flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Waiting for approval to send more messages</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-background-dark/50 rounded-full p-1 pl-4 border border-white/10 focus-within:border-primary/50 transition-colors">
                        <input
                            type="text"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a vibes..."
                            className="flex-1 bg-transparent text-white text-base placeholder:text-white/30 focus:outline-none py-3"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputText.trim()}
                            className="size-10 rounded-full bg-primary flex items-center justify-center text-background-dark disabled:opacity-50 disabled:bg-white/10 disabled:text-white/20 transition-all shadow-lg active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSearch = () => (
        <UserSearch
            currentUser={currentUser}
            onClose={() => setViewState('inbox')}
            onFriendAdded={() => { loadFriends(); setViewState('inbox'); }}
        />
    );

    return (
        <div className="fixed inset-0 z-modal bg-background-dark flex flex-col animate-slide-up">
            {viewState === 'inbox' && renderInbox()}
            {viewState === 'chat' && renderChat()}
            {viewState === 'search' && renderSearch()}

            {/* Close buttons are now handled inside the specific view headers to prevent overlapping */}
        </div>
    );
};

// Sub-component for Search
const UserSearch: React.FC<{ currentUser: User, onClose: () => void, onFriendAdded: () => void }> = ({ currentUser, onClose, onFriendAdded }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load discovery list on mount
        loadDiscoveryList();
    }, []);

    const loadDiscoveryList = async () => {
        setLoading(true);
        const res = await SocialService.getAllUsers(currentUser.id);
        setResults(res);
        setLoading(false);
    };

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length > 2) {
            setLoading(true);
            const res = await SocialService.searchUsers(val, currentUser.id);
            setResults(res);
            setLoading(false);
        } else if (val.length === 0) {
            loadDiscoveryList();
        } else {
            setResults([]);
        }
    };

    const handleAddFriend = async (userId: string) => {
        await SocialService.sendFriendRequest(currentUser.id, userId);
        alert("Request Sent!"); // Simple feedback
        onFriendAdded();
    };

    return (
        <div className="flex flex-col h-full bg-background-dark">
            <div className="flex items-center gap-4 p-4 border-b border-white/5">
                <button onClick={onClose} className="text-white/60">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <input
                    autoFocus
                    type="text"
                    placeholder="Find friends..."
                    className="flex-1 bg-transparent text-white text-lg font-bold placeholder:text-white/30 focus:outline-none"
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {results.map(u => (
                    <div key={u.id} className="glass p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onOpenProfile(u.id)}>
                            <div className="size-10 rounded-full bg-white/10 overflow-hidden">
                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-white">{u.username[0]}</span>}
                            </div>
                            <div>
                                <h3 className="text-white font-bold">{u.username}</h3>
                                {u.isPremium && <span className="text-[10px] bg-jamaican-gold text-black px-1.5 py-0.5 rounded font-black">PREMIUM</span>}
                            </div>
                        </div>
                        <button
                            onClick={() => handleAddFriend(u.id)}
                            className="bg-primary/20 hover:bg-primary text-primary hover:text-background-dark px-4 py-2 rounded-lg text-xs font-black uppercase transition-colors"
                        >
                            Add
                        </button>
                    </div>
                ))}
                {loading && <div className="text-center text-white/30 text-xs uppercase mt-8 animate-pulse">Searching global archive...</div>}
            </div>
        </div>
    );
};

export default Messages;
