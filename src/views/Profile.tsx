
import React, { useState, useRef, useMemo } from 'react';
import { JournalEntry, User, Tab, Quote, IconicQuote, BibleAffirmation } from '../types';
import UserBadge from '../components/UserBadge';

interface ProfileProps {
  user: User;
  entries: JournalEntry[];
  quotes: Quote[];
  iconic: IconicQuote[];
  bible: BibleAffirmation[];
  bookmarkedVerses: any[];
  onOpenSettings: () => void;
  onStatClick: (tab: Tab) => void;
  onUpdateUser: (data: Partial<User>) => void;
  onRemoveBookmark: (id: string, type: string) => void;
  onOpenFriendRequests: () => void;
  onFindFriends?: () => void;
  viewingUserId?: string | null;
  onClose?: () => void;
  requestCount?: number;
  unreadCount?: number;
  onRefresh?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, entries, quotes, iconic, bible, bookmarkedVerses, onOpenSettings, onStatClick, onUpdateUser, onRemoveBookmark, onOpenFriendRequests, onFindFriends, viewingUserId, onClose, requestCount: passedRequestCount = 0, unreadCount = 0, onRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cabinetRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = !viewingUserId || viewingUserId === user.id;
  const targetUserId = viewingUserId || user.id;

  // Track data for public profile
  const [publicUser, setPublicUser] = useState<User | null>(null);
  const [publicCabinet, setPublicCabinet] = useState<any[]>([]);

  // Social stats
  const [localRequestCount, setLocalRequestCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const displayRequestCount = isOwnProfile ? (passedRequestCount > 0 ? passedRequestCount : localRequestCount) : 0;

  // Fetch stats and public data
  React.useEffect(() => {
    import('../services/social').then(({ SocialService }) => {
      if (isOwnProfile && !passedRequestCount) {
        SocialService.getFriendRequests(targetUserId).then(reqs => setLocalRequestCount(reqs.length));
      } SocialService.getUserStats(targetUserId).then(stats => {
        setFriendsCount(stats.friendsCount);
        setJoinedAt(stats.createdAt);
        setLoadingStats(false);

        // Handle 24h expiration
        if (stats.statusNote && stats.statusNoteAt) {
          const noteDate = new Date(stats.statusNoteAt).getTime();
          const now = Date.now();
          if (now - noteDate < 86400000) {
            setStatusNote(stats.statusNote);
            setNoteInput(stats.statusNote);
          } else if (isOwnProfile) {
            SocialService.updateProfileNote(targetUserId, '');
          }
        }
      });

      if (!isOwnProfile) {
        SocialService.getPublicProfile(targetUserId).then(setPublicUser);
        SocialService.getPublicCabinet(targetUserId).then(cab => {
          const quoteIds = cab.quoteIds || [];
          const iconicIds = cab.iconicIds || [];
          const bibleIds = cab.bibleIds || [];
          const kjvItems = cab.kjv || [];
          const combined: any[] = [
            ...quotes.filter(q => quoteIds.includes(q.id)).map(q => ({ id: q.id, type: 'wisdom', label: 'Old Wisdom', data: q, timestamp: 1 })),
            ...iconic.filter(q => iconicIds.includes(q.id)).map(q => ({ id: q.id, type: 'legend', label: 'Iconic Soul', data: q, timestamp: 2 })),
            ...bible.filter(q => bibleIds.includes(q.id)).map(q => ({ id: q.id, type: 'verse', label: 'Scripture Flow', data: q, timestamp: 3 })),
            ...kjvItems.map((v: any) => ({ id: v.id, type: 'kjv', label: 'Holy Scripture', data: v, timestamp: v.timestamp }))
          ];
          setPublicCabinet(combined.sort((a, b) => b.timestamp - a.timestamp));
        });
      }
    });
  }, [targetUserId, isOwnProfile]);

  const handleSaveNote = async () => {
    const { SocialService } = await import('../services/social');
    await SocialService.updateProfileNote(user.id, noteInput);
    setStatusNote(noteInput);
    setIsEditingNote(false);
  };

  const memberSinceText = useMemo(() => {
    if (user.isGuest) return "Wisdom Seeker (Guest)";
    if (loadingStats) return "Joining...";
    if (!joinedAt) return "Lifelong Seeker";

    const start = new Date(joinedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30.44);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years}y ${months % 12}m in wisdom`;
    if (months > 0) return `${months}m ${days % 30}d in wisdom`;
    return `${days} days in wisdom`;
  }, [joinedAt, user.isGuest, loadingStats]);


  const savedWisdom = quotes.filter(q => q.isFavorite);
  const savedIconic = iconic.filter(q => q.isFavorite);
  const savedBible = bible.filter(q => q.isFavorite);

  const combinedFeed = useMemo(() => {
    const list = [
      ...savedWisdom.map(q => ({ id: q.id, type: 'wisdom', label: 'Old Wisdom', data: q, timestamp: q.updatedAt || 1 })),
      ...savedIconic.map(q => ({ id: q.id, type: 'legend', label: 'Iconic Soul', data: q, timestamp: 2 })),
      ...savedBible.map(q => ({ id: q.id, type: 'verse', label: 'Scripture Flow', data: q, timestamp: 3 })),
      // Ensure KJV items from Supabase are correctly mapped
      ...bookmarkedVerses.map(v => ({ id: v.id, type: 'kjv', label: 'Holy Scripture', data: v, timestamp: v.timestamp || 4 }))
    ];
    // Sort by timestamp if available
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [savedWisdom, savedIconic, savedBible, bookmarkedVerses]);

  const displayFeed = isOwnProfile ? combinedFeed : publicCabinet;
  const displayUser = isOwnProfile ? user : (publicUser || { ...user, username: 'Searching...', avatarUrl: '' });
  const displayMemberSince = isOwnProfile ? memberSinceText : (user.isGuest ? 'Wisdom Seeker (Guest)' : (loadingStats ? 'Joining...' : (joinedAt ? memberSinceText : 'Lifelong Seeker')));

  const activeDaysThisMonth = useMemo(() => {
    if (!entries || entries.length === 0) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const uniqueDays = new Set(
      entries
        .filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        })
        .map(entry => new Date(entry.timestamp).toDateString())
    );
    return uniqueDays.size;
  }, [entries]);

  const scrollToCabinet = () => {
    cabinetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="p-6 pb-24 animate-fade-in relative min-h-full font-display">
      <header className="flex items-center justify-between py-12">
        <div className="flex items-center gap-4">
          {!isOwnProfile && onClose && (
            <button
              onClick={onClose}
              className="size-11 rounded-full glass flex items-center justify-center text-white/60 shadow-lg active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              {isOwnProfile ? 'My profile' : 'Viewing profile'}
            </span>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {isOwnProfile ? 'Wise One' : displayUser.username}
            </h2>
          </div>
        </div>
        {isOwnProfile && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRefresh ? onRefresh() : window.location.reload()}
              className="size-11 rounded-full glass flex items-center justify-center text-primary shadow-lg active:scale-90 transition-transform"
              title="Refresh App"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button onClick={onOpenFriendRequests} className="size-11 rounded-full glass flex items-center justify-center text-primary shadow-lg active:scale-90 transition-transform relative">
              <span className="material-symbols-outlined">group_add</span>
              {displayRequestCount > 0 && <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">{displayRequestCount}</span>}
            </button>
            <button onClick={onOpenSettings} className="size-11 rounded-full glass flex items-center justify-center text-primary shadow-lg active:scale-90 transition-transform">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        )}
      </header>

      <div className="glass rounded-[3rem] p-10 flex flex-col items-center text-center relative overflow-hidden mb-10 shadow-2xl border-white/5 bg-gradient-to-br from-primary/5 via-transparent to-jamaican-gold/5">
        <div className="relative mb-8 group cursor-pointer" onClick={() => isOwnProfile && fileInputRef.current?.click()}>
          <div className="size-32 rounded-[2.5rem] border-4 border-primary/20 overflow-hidden shadow-2xl bg-background-dark rotate-3 group-hover:rotate-0 transition-all duration-700">
            <img className="w-full h-full object-cover" src={displayUser.avatarUrl || `https://picsum.photos/seed/${displayUser.id}/200`} alt="Avatar" />
          </div>
          {/* Badge for Admin/Donor */}
          {(displayUser.isAdmin || displayUser.isDonor) && (
            <div className="absolute -bottom-1 -right-1">
              <UserBadge user={displayUser} size="lg" />
            </div>
          )}
          {isOwnProfile && (
            <button className="absolute -bottom-2 -left-2 size-12 rounded-2xl bg-primary text-background-dark flex items-center justify-center border-4 border-[#0a1a0f] shadow-2xl group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">photo_camera</span>
            </button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const r = new FileReader();
              r.onload = () => onUpdateUser({ avatarUrl: r.result as string });
              r.readAsDataURL(file);
            }
          }} />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{displayUser.username}</h1>
        </div>

        {/* 24h Note Area */}
        <div className="mb-4 w-full px-4">
          {isOwnProfile && isEditingNote ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveNote()}
                placeholder="What's on your mind? (24h)"
                className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none border border-primary/30"
                maxLength={60}
              />
              <button
                onClick={handleSaveNote}
                className="size-8 rounded-lg bg-primary text-background-dark flex items-center justify-center transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-base">check</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => isOwnProfile && setIsEditingNote(true)}
              className={`group flex flex-col items-center ${isOwnProfile ? 'cursor-pointer' : ''}`}
            >
              <p className="text-slate-900/60 dark:text-white/60 text-[11px] font-bold italic line-clamp-2 max-w-[200px]">
                {statusNote ? `"${statusNote}"` : (isOwnProfile ? "Tap to add a vibe note..." : "")}
              </p>
              {isOwnProfile && <span className="text-[7px] text-primary/40 uppercase font-black tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Expires in 24h • Tap to edit</span>}
            </div>
          )}
        </div>

        <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em] mb-8">{memberSinceText}</p>

        {isOwnProfile && onFindFriends && (
          <button
            onClick={onFindFriends}
            className="w-full mb-8 glass py-4 rounded-2xl flex items-center justify-center gap-2 text-primary border-primary/20 active:scale-[0.98] transition-all group"
          >
            <span className="material-symbols-outlined text-lg group-hover:animate-bounce">person_add</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Find More Wise Ones</span>
          </button>
        )}

        <div className="grid grid-cols-4 gap-2 w-full">
          <button onClick={scrollToCabinet} className="glass py-5 rounded-3xl active:scale-95 transition-all border-white/5 hover:border-primary/20">
            <p className="text-primary font-black text-xl">{combinedFeed.length}</p>
            <p className="text-[7px] uppercase tracking-widest text-slate-900/30 dark:text-white/30 font-bold">Saved</p>
          </button>
          <button onClick={() => onStatClick('book')} className="glass py-5 rounded-3xl border-x border-white/5 active:scale-95 transition-all hover:border-jamaican-gold/20">
            <p className="text-jamaican-gold font-black text-xl">{entries.length}</p>
            <p className="text-[7px] uppercase tracking-widest text-slate-900/30 dark:text-white/30 font-bold">Journals</p>
          </button>
          <div className="glass py-5 rounded-3xl border-white/5 relative overflow-hidden">
            <p className="text-primary font-black text-xl">{friendsCount}</p>
            <p className="text-[7px] uppercase tracking-widest text-slate-900/30 dark:text-white/30 font-bold">Friends</p>
          </div>
          <div className="glass py-5 rounded-3xl border-white/5 relative overflow-hidden">
            <p className="text-primary font-black text-xl">{activeDaysThisMonth}</p>
            <p className="text-[7px] uppercase tracking-widest text-slate-900/30 dark:text-white/30 font-bold">Active</p>
            {activeDaysThisMonth > 0 && <div className="absolute top-1 right-1"><span className="material-symbols-outlined text-[10px] text-primary animate-pulse">local_fire_department</span></div>}
          </div>
        </div>
      </div>

      <div className="mb-8 pt-4" ref={cabinetRef}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900/30 dark:text-white/30 mb-8 px-4 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
          Saved Wisdom Cabinet
        </h3>

        <div className="space-y-6">
          {combinedFeed.map((item) => (
            <div key={`${item.type}-${item.id}`} className="glass p-8 rounded-[2.5rem] border-white/5 shadow-xl animate-fade-in group hover:border-primary/30 transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-2 w-fit">
                    {item.label}
                  </span>
                  <p className="text-[10px] font-bold text-slate-900/20 dark:text-white/20 uppercase tracking-widest flex items-center gap-1">
                    {isOwnProfile ? 'Added to Likkle Book' : 'Saved in Cabinet'} <span className="material-symbols-outlined text-[10px]">auto_stories</span>
                  </p>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => onRemoveBookmark(item.id, item.type)}
                    className="size-12 rounded-2xl glass text-slate-900/10 dark:text-white/10 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all flex items-center justify-center group/btn"
                  >
                    <span className="material-symbols-outlined text-2xl group-hover/btn:scale-110 transition-transform">delete_forever</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-slate-900 dark:text-white text-2xl font-black leading-tight tracking-tight">
                  "{item.type === 'kjv' ? (item.data as any).text : (item.data as any).patois || (item.data as any).text}"
                </p>
                <div className="h-px w-12 bg-primary/20"></div>
                <p className="text-sm text-slate-900/40 dark:text-white/40 italic font-medium leading-relaxed">
                  {item.type === 'kjv' ? (item.data as any).reference : (item.data as any).english || `Author: ${(item.data as any).author}`}
                </p>
              </div>

              <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[100px]">{item.type === 'kjv' || item.type === 'verse' ? 'menu_book' : 'spa'}</span>
              </div>
            </div>
          ))}

          {combinedFeed.length === 0 && (
            <div className="text-center py-24 flex flex-col items-center glass rounded-[3rem] border-dashed border-slate-200 dark:border-white/10 mx-2">
              <div className="size-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-6xl text-slate-900/10 dark:text-white/10">bookmark_add</span>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-900/20 dark:text-white/20">Your cabinet is empty.</p>
              <button onClick={() => onStatClick('discover')} className="mt-6 text-primary font-black uppercase tracking-widest text-xs hover:underline">Find some vibes →</button>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default Profile;
