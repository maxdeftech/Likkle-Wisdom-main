
import React, { useState, useEffect } from 'react';
import { User, Friendship, ChatMessage } from '../types';
import { SocialService } from '../services/social';
import { MessagingService } from '../services/messaging';
import { supabase } from '../services/supabase';
import UserBadge from '../components/UserBadge';

interface MessagesProps {
    currentUser: User;
    onClose: () => void;
    onOpenProfile: (userId: string) => void;
    initialSearch?: boolean;
    onUnreadUpdate?: () => void;
}

type ViewState = 'inbox' | 'chat' | 'search';

const Messages: React.FC<MessagesProps> = ({ currentUser, onClose, onOpenProfile, initialSearch = false, onUnreadUpdate }) => {
    const [viewState, setViewState] = useState<ViewState>(initialSearch ? 'search' : 'inbox');
    const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [friendshipStatus, setFriendshipStatus] = useState<'pending' | 'accepted' | 'none'>('none');

    // Load unread counts from DB on mount
    useEffect(() => {
        loadFriends();
        loadUnreadCounts();
        const interval = setInterval(loadFriends, 30000);

        // Subscribe to all incoming messages
        const channel = MessagingService.subscribeToMessages(currentUser.id, (msg) => {
            setMessages(prev => {
                // Prevent duplicates
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            // Only increment if not currently viewing that chat
            if (msg.senderId !== activeChatUser?.id) {
                setUnreadCounts(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
            } else {
                // Auto-mark as read since we're in the chat
                MessagingService.markAsRead(msg.senderId, currentUser.id);
            }
        });

        return () => { channel?.unsubscribe(); clearInterval(interval); };
    }, [currentUser.id]);

    const loadUnreadCounts = async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('receiver_id', currentUser.id)
            .eq('read', false);

        if (data) {
            const counts: Record<string, number> = {};
            data.forEach((m: any) => {
                counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
            });
            setUnreadCounts(counts);
        }
    };

    useEffect(() => {
        // Load history when entering chat and mark as read
        if (activeChatUser) {
            MessagingService.getMessages(activeChatUser.id, currentUser.id).then(setMessages);

            // Mark as read in DB and update local state
            const prevCount = unreadCounts[activeChatUser.id] || 0;
            if (prevCount > 0) {
                setUnreadCounts(prev => ({ ...prev, [activeChatUser.id]: 0 }));
                MessagingService.markAsRead(activeChatUser.id, currentUser.id).then(() => {
                    if (onUnreadUpdate) onUnreadUpdate();
                });
            }

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
                        }} className="glass p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group">
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
                                {/* Badge indicator - would need to fetch user data to show badge here */}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm truncate">{f.friendName}</h3>
                                {f.lastMessage ? (
                                    <p className={`text-xs truncate ${unreadCounts[f.friendId] > 0 ? 'text-primary font-black' : 'text-white/40'}`}>
                                        {f.lastMessage.senderId === currentUser.id ? 'You: ' : ''}{f.lastMessage.content}
                                    </p>
                                ) : (
                                    <p className="text-white/40 text-xs truncate">Tap to chat with {f.friendName}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {f.lastMessage && (
                                    <span className="text-[8px] font-black text-white/20 uppercase">
                                        {new Date(f.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteChat(f.id);
                                        }}
                                        className="size-8 rounded-full glass flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Friend"
                                    >
                                        <span className="material-symbols-outlined text-sm">person_remove</span>
                                    </button>
                                    {unreadCounts[f.friendId] > 0 && (
                                        <div className="size-5 bg-primary rounded-full flex items-center justify-center animate-pop shadow-lg shadow-primary/20">
                                            <span className="text-background-dark font-black text-[9px]">{unreadCounts[f.friendId]}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
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
            onFriendAdded={() => { loadFriends(); }}
            onOpenProfile={onOpenProfile}
        />
    );

    return (
        <div className="fixed inset-0 z-modal bg-background-dark flex flex-col pt-safe animate-slide-up">
            {viewState === 'inbox' && renderInbox()}
            {viewState === 'chat' && renderChat()}
            {viewState === 'search' && renderSearch()}

            {/* Close buttons are now handled inside the specific view headers to prevent overlapping */}
        </div>
    );
};

// Sub-component for Search
const UserSearch: React.FC<{ currentUser: User, onClose: () => void, onFriendAdded: () => void, onOpenProfile: (userId: string) => void }> = ({ currentUser, onClose, onFriendAdded, onOpenProfile }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [friendshipMap, setFriendshipMap] = useState<Record<string, 'accepted' | 'pending_outgoing' | 'pending_incoming'>>({});
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 50;

    useEffect(() => {
        // Load discovery list on mount
        refreshFriendshipMap();
        loadDiscoveryList(true);
    }, []);

    const refreshFriendshipMap = async () => {
        const map = await SocialService.getMyFriendshipMap(currentUser.id);
        setFriendshipMap(map);
    };

    const loadDiscoveryList = async (reset = false) => {
        setLoading(true);
        const nextOffset = reset ? 0 : offset;
        const res = await SocialService.getAllUsers(currentUser.id, { offset: nextOffset, limit: PAGE_SIZE });

        setResults(prev => reset ? res : [...prev, ...res]);
        setOffset(nextOffset + res.length);
        setHasMore(res.length === PAGE_SIZE);
        setLoading(false);
    };

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length > 2) {
            setLoading(true);
            const res = await SocialService.searchUsers(val, currentUser.id);
            setResults(res);
            setHasMore(false);
            setLoading(false);
        } else if (val.length === 0) {
            setHasMore(true);
            setOffset(0);
            loadDiscoveryList(true);
        } else {
            // Keep the previous results or show the discovery list
            // Instead of clearing, we just wait for more characters
        }
    };

    const handleAddFriend = async (userId: string) => {
        // Optimistic UI update
        setFriendshipMap(prev => ({ ...prev, [userId]: 'pending_outgoing' }));

        const res = await SocialService.sendFriendRequest(currentUser.id, userId);
        if ((res as any)?.error) {
            // Re-sync statuses (in case state was wrong)
            await refreshFriendshipMap();
            const msg = (res as any)?.error;
            alert(typeof msg === 'string' ? msg : 'Failed to send request');
            return;
        }

        alert("Request Sent!");
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
                            <div className="relative">
                                <div className="size-10 rounded-full bg-white/10 overflow-hidden">
                                    {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-white">{u.username[0]}</span>}
                                </div>
                                {(u.isAdmin || u.isDonor) && (
                                    <div className="absolute -bottom-1 -right-1">
                                        <UserBadge user={u} size="sm" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-bold">{u.username}</h3>
                                </div>
                                {u.isPremium && <span className="text-[10px] bg-jamaican-gold/20 text-jamaican-gold px-1.5 py-0.5 rounded font-black">PREMIUM</span>}
                            </div>
                        </div>
                        {(() => {
                            const status = friendshipMap[u.id];
                            const isDisabled = status === 'accepted' || status === 'pending_outgoing' || status === 'pending_incoming';
                            const label =
                                status === 'accepted'
                                    ? 'Friends'
                                    : status === 'pending_outgoing'
                                        ? 'Waiting for approval'
                                        : status === 'pending_incoming'
                                            ? 'Requested you'
                                            : 'Add';

                            return (
                                <button
                                    disabled={isDisabled}
                                    onClick={() => handleAddFriend(u.id)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-colors ${isDisabled
                                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                        : 'bg-primary/20 hover:bg-primary text-primary hover:text-background-dark'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })()}
                    </div>
                ))}
                {loading && <div className="text-center text-white/30 text-xs uppercase mt-8 animate-pulse">Searching global archive...</div>}

                {!loading && query.length === 0 && hasMore && results.length > 0 && (
                    <button
                        onClick={() => loadDiscoveryList(false)}
                        className="w-full glass rounded-xl py-4 text-primary text-xs font-black uppercase tracking-widest active:scale-[0.99] transition-all"
                    >
                        Load more
                    </button>
                )}
            </div>
        </div>
    );
};

export default Messages;
