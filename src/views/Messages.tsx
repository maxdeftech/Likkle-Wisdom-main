
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    initialChatUserId?: string | null;
    onUnreadUpdate?: () => void;
}

type ViewState = 'inbox' | 'chat' | 'search';

const Messages: React.FC<MessagesProps> = ({ currentUser, onClose, onOpenProfile, initialSearch = false, initialChatUserId, onUnreadUpdate }) => {
    const [viewState, setViewState] = useState<ViewState>(initialSearch ? 'search' : 'inbox');
    const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
    const [contextMessage, setContextMessage] = useState<ChatMessage | null>(null);
    const [messageMenuPos, setMessageMenuPos] = useState({ x: 0, y: 0 });
    const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
    const [messageReactions, setMessageReactions] = useState<Record<string, { count: number; userReacted: boolean }>>({});
    const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
    const messageLongPressTimerRef = useRef<number | null>(null);
    const [friendshipStatus, setFriendshipStatus] = useState<'pending' | 'accepted' | 'none'>('none');
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);

    // Track active chat user in a ref so subscription callback always has the latest value
    const activeChatUserRef = useRef<User | null>(null);
    useEffect(() => { activeChatUserRef.current = activeChatUser; }, [activeChatUser]);

    // Load friends and unread counts on mount; show loading until friends are loaded
    useEffect(() => {
        setFriendsLoading(true);
        loadFriends().then(() => setFriendsLoading(false));
        loadUnreadCounts();
        const interval = setInterval(() => loadFriends(), 30000);

        // Subscribe to all incoming messages
        const channel = MessagingService.subscribeToMessages(currentUser.id, (msg) => {
            setMessages(prev => {
                // Prevent duplicates
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            // Use ref to get current active chat user (avoids stale closure)
            const currentChat = activeChatUserRef.current;
            if (msg.senderId !== currentChat?.id) {
                setUnreadCounts(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
                if (onUnreadUpdate) onUnreadUpdate();
            } else {
                // Auto-mark as read since we're in the chat
                MessagingService.markAsRead(msg.senderId, currentUser.id).then(() => {
                    if (onUnreadUpdate) onUnreadUpdate();
                });
            }
            // Also refresh friends list to update last message preview
            loadFriends();
        });

        return () => { channel?.unsubscribe(); clearInterval(interval); };
    }, [currentUser.id]);

    const loadUnreadCounts = async () => {
        if (!supabase) return;
        // Fetch all messages and filter client-side to handle both text/boolean read column
        const { data } = await supabase
            .from('messages')
            .select('sender_id, read')
            .eq('receiver_id', currentUser.id);

        if (data) {
            const counts: Record<string, number> = {};
            data
                .filter((m: any) => m.read === false || m.read === 'false')
                .forEach((m: any) => {
                    counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
                });
            setUnreadCounts(counts);
        }
    };

    useEffect(() => {
        // Load history when entering chat and always mark as read
        if (activeChatUser) {
            setReplyingToMessage(null);
            setContextMessage(null);
            setOtherUserTyping(false);
            setMessagesLoading(true);

            // Show cached messages immediately when available so the app loads as fast as possible
            MessagingService.getMessagesFromCache(activeChatUser.id, currentUser.id).then((cached) => {
                if (cached.length > 0) {
                    setMessages(cached);
                    setMessagesLoading(false);
                    const ids = cached.map(m => m.id);
                    MessagingService.getReactionsForMessages(ids, currentUser.id).then(setMessageReactions);
                    MessagingService.getPinnedMessage(currentUser.id, activeChatUser.id).then(setPinnedMessageId);
                    MessagingService.getStarredMessageIds(currentUser.id, ids).then(setStarredIds);
                }
            }).catch(() => {
                setMessagesLoading(false);
            });

            // Full sync from Supabase; when done, show latest and hide loading if still visible
            MessagingService.getMessages(activeChatUser.id, currentUser.id).then((msgs) => {
                setMessages(msgs);
                setMessagesLoading(false);
                const ids = msgs.map(m => m.id);
                if (ids.length > 0) {
                    MessagingService.getReactionsForMessages(ids, currentUser.id).then(setMessageReactions);
                    MessagingService.getPinnedMessage(currentUser.id, activeChatUser.id).then(setPinnedMessageId);
                    MessagingService.getStarredMessageIds(currentUser.id, ids).then(setStarredIds);
                } else {
                    setMessageReactions({});
                    setPinnedMessageId(null);
                    setStarredIds(new Set());
                }
            }).catch((err) => {
                console.warn('[Messages] Load failed (e.g. RLS or network):', err);
                setMessages([]);
                setMessagesLoading(false);
                setMessageReactions({});
                setPinnedMessageId(null);
                setStarredIds(new Set());
            });

            // Immediately zero out local count for this chat
            setUnreadCounts(prev => {
                const updated = { ...prev, [activeChatUser.id]: 0 };
                return updated;
            });

            // Mark all messages from this sender as read in DB
            const doMarkRead = async () => {
                await MessagingService.markAsRead(activeChatUser.id, currentUser.id);
                // Refresh from DB to ensure sync
                await loadUnreadCounts();
                // Notify App.tsx to refresh the global badge immediately
                if (onUnreadUpdate) onUnreadUpdate();
            };
            doMarkRead();

            // Also mark as read again after a brief delay to catch any race conditions
            const timer = setTimeout(doMarkRead, 2000);

            SocialService.getFriendshipStatus(currentUser.id, activeChatUser.id).then(setFriendshipStatus);

            // When leaving chat, mark as read one more time to be safe
            return () => {
                clearTimeout(timer);
                MessagingService.markAsRead(activeChatUser.id, currentUser.id).then(() => {
                    if (onUnreadUpdate) onUnreadUpdate();
                });
            };
        }
    }, [activeChatUser, currentUser.id]);

    const loadFriends = async () => {
        const f = await SocialService.getFriends(currentUser.id);
        setFriends(f);
        return f;
    };

    // Auto-open chat when opened from notification (initialChatUserId)
    useEffect(() => {
        if (!initialChatUserId || friends.length === 0) return;
        const friend = friends.find(f => f.friendId === initialChatUserId);
        if (friend) {
            setActiveChatUser({ id: friend.friendId, username: friend.friendName, avatarUrl: friend.friendAvatar, isGuest: false, isPremium: false });
            setViewState('chat');
        }
    }, [initialChatUserId, friends]);

    // Scroll to latest message when messages load or change
    useEffect(() => {
        if (messagesLoading || messages.length === 0) return;
        const t = requestAnimationFrame(() => {
            scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
        return () => cancelAnimationFrame(t);
    }, [messagesLoading, messages.length]);

    // Typing indicator: listen for other user typing (on our channel)
    useEffect(() => {
        if (!supabase || !currentUser.id) return;
        const ch = supabase.channel(`messages:${currentUser.id}`)
            .on('broadcast', { event: 'user_typing' }, (payload: { payload?: { userId?: string } }) => {
                const uid = payload.payload?.userId;
                if (uid && activeChatUserRef.current?.id === uid) {
                    setOtherUserTyping(true);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = window.setTimeout(() => setOtherUserTyping(false), 3000);
                }
            })
            .subscribe();
        return () => { ch.unsubscribe(); };
    }, [currentUser.id]);

    // Typing indicator: subscribe to other user's channel and send our typing (debounced)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typingSendChannelRef = useRef<any>(null);
    const typingDebounceRef = useRef<number | null>(null);
    useEffect(() => {
        if (!supabase || !activeChatUser) {
            typingSendChannelRef.current?.unsubscribe();
            typingSendChannelRef.current = null;
            return;
        }
        const ch = supabase.channel(`messages:${activeChatUser.id}`).subscribe();
        typingSendChannelRef.current = ch;
        return () => {
            ch.unsubscribe();
            typingSendChannelRef.current = null;
        };
    }, [activeChatUser?.id]);

    useEffect(() => {
        if (!activeChatUser || !inputText.trim()) return;
        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = window.setTimeout(() => {
            typingSendChannelRef.current?.send({
                type: 'broadcast',
                event: 'user_typing',
                payload: { userId: currentUser.id }
            });
            typingDebounceRef.current = null;
        }, 300);
        return () => { if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current); };
    }, [activeChatUser?.id, currentUser.id, inputText]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeChatUser || friendshipStatus === 'pending') return;
        const text = inputText;
        const replyToId = replyingToMessage?.id;
        setInputText('');
        setReplyingToMessage(null);

        try {
            const msg = await MessagingService.sendMessage(currentUser.id, activeChatUser.id, text, replyToId);
            if (msg) setMessages(prev => [...prev, msg]);
        } catch (e) {
            console.error("Failed to send", e);
        }
    };

    const handleDeleteChat = async (friendId: string) => {
        if (!confirm("Are you sure you want to delete this chat? Messages will be removed.")) return;
        // Only delete messages between the two users, NOT the friendship
        if (supabase) {
            await supabase
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`);
        }
        // Clear local messages for this chat
        setMessages([]);
        // Refresh friends list to clear last message preview
        await loadFriends();
        await loadUnreadCounts();
        if (onUnreadUpdate) onUnreadUpdate();
        setViewState('inbox');
        setActiveChatUser(null);
    };

    // --- LONG-PRESS CONTEXT MENU ---
    const [contextMenuFriend, setContextMenuFriend] = useState<Friendship | null>(null);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const longPressTimerRef = useRef<number | null>(null);
    const [pinnedChats, setPinnedChats] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem(`pinned_chats_${currentUser.id}`) || '[]'); } catch { return []; }
    });

    const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent, friend: Friendship) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        longPressTimerRef.current = window.setTimeout(() => {
            setContextMenuFriend(friend);
            setContextMenuPos({ x: clientX, y: clientY });
        }, 500);
    }, []);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const handlePinChat = (friendId: string) => {
        setPinnedChats(prev => {
            const next = prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId];
            localStorage.setItem(`pinned_chats_${currentUser.id}`, JSON.stringify(next));
            return next;
        });
        setContextMenuFriend(null);
    };

    const handleRemoveFriend = async (friendshipId: string) => {
        setContextMenuFriend(null);
        if (!confirm("Remove this friend?")) return;
        const { error } = await SocialService.deleteFriendship(friendshipId);
        if (!error) {
            setFriends(prev => prev.filter(f => f.id !== friendshipId));
        }
    };

    const handleDeleteChatFromMenu = async (friendId: string) => {
        setContextMenuFriend(null);
        handleDeleteChat(friendId);
    };

    const handleMessageContextPin = async () => {
        if (!contextMessage || !activeChatUser) return;
        await MessagingService.setPinnedMessage(currentUser.id, activeChatUser.id, contextMessage.id);
        setPinnedMessageId(contextMessage.id);
        setContextMessage(null);
    };
    const handleMessageContextDelete = async () => {
        if (!contextMessage || contextMessage.senderId !== currentUser.id) return;
        await MessagingService.deleteMessage(contextMessage.id, currentUser.id);
        setMessages(prev => prev.filter(m => m.id !== contextMessage.id));
        if (pinnedMessageId === contextMessage.id) setPinnedMessageId(null);
        setContextMessage(null);
    };
    const handleMessageContextLike = async () => {
        if (!contextMessage) return;
        const r = messageReactions[contextMessage.id];
        if (r?.userReacted) {
            await MessagingService.removeReaction(contextMessage.id, currentUser.id);
            setMessageReactions(prev => ({ ...prev, [contextMessage.id]: { count: (r.count || 1) - 1, userReacted: false } }));
        } else {
            await MessagingService.addReaction(contextMessage.id, currentUser.id);
            setMessageReactions(prev => ({ ...prev, [contextMessage.id]: { count: (prev[contextMessage.id]?.count || 0) + 1, userReacted: true } }));
        }
        setContextMessage(null);
    };
    const handleMessageContextStar = async () => {
        if (!contextMessage) return;
        if (starredIds.has(contextMessage.id)) {
            await MessagingService.unstarMessage(currentUser.id, contextMessage.id);
            setStarredIds(prev => { const n = new Set(prev); n.delete(contextMessage.id); return n; });
        } else {
            await MessagingService.starMessage(currentUser.id, contextMessage.id);
            setStarredIds(prev => new Set([...prev, contextMessage.id]));
        }
        setContextMessage(null);
    };

    // Sort friends: pinned first, then by last message time
    const sortedFriends = [...friends].sort((a, b) => {
        const aPinned = pinnedChats.includes(a.friendId);
        const bPinned = pinnedChats.includes(b.friendId);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return bTime - aTime;
    });

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
                {friendsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-primary/50 animate-pulse mb-4">schedule</span>
                        <p className="text-white/60 text-sm font-bold uppercase tracking-widest px-6">
                            Di message dem a fawud in deh, just wul on likkle bit
                        </p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-white/30 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                        <p className="text-xs font-bold uppercase tracking-wider">No friends yet</p>
                        <button onClick={() => setViewState('search')} className="mt-4 text-primary text-xs font-black uppercase underline">Find People</button>
                    </div>
                ) : (
                    sortedFriends.map(f => (
                        <div
                            key={f.id}
                            onClick={() => {
                                if (contextMenuFriend) { setContextMenuFriend(null); return; }
                                setActiveChatUser({ id: f.friendId, username: f.friendName, avatarUrl: f.friendAvatar, isGuest: false, isPremium: false });
                                setViewState('chat');
                            }}
                            onTouchStart={(e) => handleLongPressStart(e, f)}
                            onTouchEnd={handleLongPressEnd}
                            onTouchMove={handleLongPressEnd}
                            onMouseDown={(e) => handleLongPressStart(e, f)}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            className="glass p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer select-none"
                        >
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
                                {pinnedChats.includes(f.friendId) && (
                                    <span className="absolute -top-1 -left-1 material-symbols-outlined text-jamaican-gold text-[14px] drop-shadow">push_pin</span>
                                )}
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
                                {unreadCounts[f.friendId] > 0 && (
                                    <div className="size-5 bg-primary rounded-full flex items-center justify-center animate-pop shadow-lg shadow-primary/20">
                                        <span className="text-background-dark font-black text-[9px]">{unreadCounts[f.friendId]}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Long-press context menu */}
            {contextMenuFriend && (
                <>
                    <div className="fixed inset-0 z-[300]" onClick={() => setContextMenuFriend(null)}></div>
                    <div
                        className="fixed z-[301] glass rounded-2xl p-2 shadow-2xl border border-white/10 min-w-[180px] animate-scale-up"
                        style={{ top: Math.min(contextMenuPos.y, window.innerHeight - 180), left: Math.min(contextMenuPos.x, window.innerWidth - 200) }}
                    >
                        <button
                            onClick={() => handleDeleteChatFromMenu(contextMenuFriend.friendId)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-red-400 text-lg">delete</span>
                            <span className="text-xs font-black uppercase tracking-wider">Delete Chat</span>
                        </button>
                        <button
                            onClick={() => handleRemoveFriend(contextMenuFriend.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-orange-400 text-lg">person_remove</span>
                            <span className="text-xs font-black uppercase tracking-wider">Remove Friend</span>
                        </button>
                        <button
                            onClick={() => handlePinChat(contextMenuFriend.friendId)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-jamaican-gold text-lg">push_pin</span>
                            <span className="text-xs font-black uppercase tracking-wider">
                                {pinnedChats.includes(contextMenuFriend.friendId) ? 'Unpin Chat' : 'Pin Chat'}
                            </span>
                        </button>
                    </div>
                </>
            )}
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
            </div>

            {/* Messages List */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-primary/50 animate-pulse mb-4">schedule</span>
                        <p className="text-white/60 text-sm font-bold uppercase tracking-widest px-6">
                            Di message dem a fawud in deh, just wul on likkle bit
                        </p>
                    </div>
                ) : (
                <>
                    {pinnedMessageId && (() => {
                        const pinned = messages.find(m => m.id === pinnedMessageId);
                        if (!pinned) return null;
                        return (
                            <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 mb-2">
                                <span className="material-symbols-outlined text-jamaican-gold text-sm">push_pin</span>
                                <span className="text-[10px] text-white/60 truncate flex-1">Pinned: {pinned.content.slice(0, 60)}{pinned.content.length > 60 ? '…' : ''}</span>
                            </div>
                        );
                    })()}
                    {messages.map((msg, i) => {
                        const isMe = msg.senderId === currentUser.id;
                        const showTime = i === messages.length - 1 || (messages[i + 1] && messages[i + 1].timestamp - msg.timestamp > 300000); // 5 min gap
                        const repliedTo = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
                        const reaction = messageReactions[msg.id];
                        const isStarred = starredIds.has(msg.id);

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                onTouchStart={(e) => {
                                    messageLongPressTimerRef.current = window.setTimeout(() => {
                                        setContextMessage(msg);
                                        setMessageMenuPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                                    }, 500);
                                }}
                                onTouchEnd={() => { if (messageLongPressTimerRef.current) clearTimeout(messageLongPressTimerRef.current); messageLongPressTimerRef.current = null; }}
                                onTouchMove={() => { if (messageLongPressTimerRef.current) clearTimeout(messageLongPressTimerRef.current); messageLongPressTimerRef.current = null; }}
                                onMouseDown={(e) => {
                                    messageLongPressTimerRef.current = window.setTimeout(() => {
                                        setContextMessage(msg);
                                        setMessageMenuPos({ x: e.clientX, y: e.clientY });
                                    }, 500);
                                }}
                                onMouseUp={() => { if (messageLongPressTimerRef.current) clearTimeout(messageLongPressTimerRef.current); messageLongPressTimerRef.current = null; }}
                                onMouseLeave={() => { if (messageLongPressTimerRef.current) clearTimeout(messageLongPressTimerRef.current); messageLongPressTimerRef.current = null; }}
                            >
                                <div className={`max-w-[80%] group flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${isMe
                                        ? 'bg-primary text-background-dark rounded-tr-sm font-medium shadow-lg'
                                        : 'glass text-white rounded-tl-sm border border-white/10'
                                        }`}>
                                        {repliedTo && (
                                            <div className={`mb-2 pl-2 border-l-2 ${isMe ? 'border-background-dark/30' : 'border-white/30'} text-[10px] opacity-80 truncate max-w-full`}>
                                                Replying to: {repliedTo.content.slice(0, 40)}{repliedTo.content.length > 40 ? '…' : ''}
                                            </div>
                                        )}
                                        {msg.content}
                                        {(reaction?.count ?? 0) > 0 && (
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <span className={`material-symbols-outlined text-xs ${reaction?.userReacted ? 'text-primary fill-primary' : 'text-white/40'}`}>thumb_up</span>
                                                <span className="text-[9px] opacity-80">{reaction?.count}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReplyingToMessage(msg); }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-primary"
                                            aria-label="Reply"
                                        >
                                            <span className="material-symbols-outlined text-sm">reply</span>
                                        </button>
                                    </div>
                                </div>
                                {isStarred && (
                                    <span className="material-symbols-outlined text-jamaican-gold text-xs mt-0.5" title="Starred">star</span>
                                )}
                                {showTime && (
                                    <span className="text-[9px] text-white/20 mt-1 font-bold uppercase tracking-widest">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    <div ref={scrollAnchorRef} id="scroll-anchor"></div>
                </>
                )}
            </div>

            {/* Message long-press context menu */}
            {contextMessage && (
                <>
                    <div className="fixed inset-0 z-[300]" onClick={() => setContextMessage(null)} aria-hidden="true" />
                    <div
                        className="fixed z-[301] glass rounded-2xl p-2 shadow-2xl border border-white/10 min-w-[180px] animate-scale-up"
                        style={{ top: Math.min(messageMenuPos.y, window.innerHeight - 220), left: Math.min(messageMenuPos.x, window.innerWidth - 200) }}
                    >
                        <button onClick={handleMessageContextPin} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5">
                            <span className="material-symbols-outlined text-jamaican-gold text-lg">push_pin</span>
                            <span className="text-xs font-black uppercase tracking-wider">Pin</span>
                        </button>
                        {contextMessage.senderId === currentUser.id && (
                            <button onClick={handleMessageContextDelete} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5">
                                <span className="material-symbols-outlined text-red-400 text-lg">delete</span>
                                <span className="text-xs font-black uppercase tracking-wider">Delete</span>
                            </button>
                        )}
                        <button onClick={handleMessageContextLike} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5">
                            <span className="material-symbols-outlined text-primary text-lg">thumb_up</span>
                            <span className="text-xs font-black uppercase tracking-wider">{messageReactions[contextMessage.id]?.userReacted ? 'Unlike' : 'Like'}</span>
                        </button>
                        <button onClick={handleMessageContextStar} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5">
                            <span className={`material-symbols-outlined text-lg ${starredIds.has(contextMessage.id) ? 'text-jamaican-gold fill-jamaican-gold' : 'text-white/60'}`}>star</span>
                            <span className="text-xs font-black uppercase tracking-wider">{starredIds.has(contextMessage.id) ? 'Unstar' : 'Star'}</span>
                        </button>
                    </div>
                </>
            )}

            {/* Typing indicator */}
                {otherUserTyping && activeChatUser && (
                    <div className="px-4 py-2 flex items-center gap-2 text-white/50 text-xs">
                        <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="font-bold uppercase tracking-wider">{activeChatUser.username} is typing...</span>
                    </div>
                )}
            {/* Input Area */}
            <div className="p-4 glass border-t border-white/5 z-10">
                {replyingToMessage && (
                    <div className="flex items-center justify-between gap-2 mb-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-white/60 truncate flex-1">Replying to: {replyingToMessage.content.slice(0, 50)}{replyingToMessage.content.length > 50 ? '…' : ''}</span>
                        <button onClick={() => setReplyingToMessage(null)} className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-white/60" aria-label="Cancel reply">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}
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
                                {u.isAdmin && (
                                    <div className="absolute -bottom-1 -right-1">
                                        <UserBadge user={u} size="sm" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-bold">{u.username}</h3>
                                </div>
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
