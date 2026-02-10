import React, { useState, useEffect, useRef } from 'react';
import { Post, User, UserWisdom } from '../types';
import { FeedService } from '../services/feedService';

const BOOK_CHAPTERS: Record<string, number> = {
  "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
  "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
  "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66, "Jeremiah": 52,
  "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3,
  "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3,
  "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
  "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
  "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
  "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
  "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
  "Jude": 1, "Revelation": 22
};

interface FeedProps {
  user: User;
  isOnline: boolean;
  userWisdoms: UserWisdom[];
}

type CreateType = 'text' | 'image' | 'video' | 'scripture' | 'wisdom';

const Feed: React.FC<FeedProps> = ({ user, isOnline, userWisdoms }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<CreateType>('text');
  const [textContent, setTextContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Scripture picker state
  const [scrBook, setScrBook] = useState('Psalms');
  const [scrChapter, setScrChapter] = useState(23);
  const [scrVerse, setScrVerse] = useState(1);
  const [scrText, setScrText] = useState('');
  const [loadingVerse, setLoadingVerse] = useState(false);

  // Wisdom picker state
  const [selectedWisdomIdx, setSelectedWisdomIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
    const sub = FeedService.subscribeToFeed((newPost) => {
      setPosts(prev => {
        if (prev.find(p => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    });
    return () => { sub?.unsubscribe(); };
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const p = await FeedService.getPosts();
    setPosts(p);
    setLoading(false);
  };

  const fetchVerse = async () => {
    setLoadingVerse(true);
    try {
      const res = await fetch(`https://bible-api.com/${scrBook}+${scrChapter}:${scrVerse}?translation=kjv`);
      const data = await res.json();
      if (data.text) setScrText(data.text.trim());
      else setScrText('Verse not found.');
    } catch { setScrText('Could not load verse.'); }
    setLoadingVerse(false);
  };

  useEffect(() => {
    if (createType === 'scripture') fetchVerse();
  }, [scrBook, scrChapter, scrVerse, createType]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const handleCreatePost = async () => {
    if (posting) return;
    setPosting(true);

    let postData: any = {};

    if (createType === 'text') {
      if (!textContent.trim()) { setPosting(false); return; }
      postData = { textContent: textContent.trim() };
    } else if (createType === 'image' || createType === 'video') {
      if (!mediaFile) { setPosting(false); return; }
      postData = { mediaFile, textContent: textContent.trim() || undefined };
    } else if (createType === 'scripture') {
      postData = {
        scriptureRef: { book: scrBook, chapter: scrChapter, verse: scrVerse, text: scrText },
        textContent: textContent.trim() || undefined
      };
    } else if (createType === 'wisdom') {
      if (userWisdoms.length === 0) { setPosting(false); return; }
      const w = userWisdoms[selectedWisdomIdx];
      postData = {
        wisdomRef: { patois: w.patois, english: w.english },
        textContent: textContent.trim() || undefined
      };
    }

    const { post, error } = await FeedService.createPost(user.id, createType, postData);
    if (post) {
      setPosts(prev => [post, ...prev]);
    } else {
      alert(error || 'Failed to post');
    }

    // Reset
    setPosting(false);
    setShowCreate(false);
    setTextContent('');
    setMediaFile(null);
    setMediaPreview(null);
    setCreateType('text');
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await FeedService.deletePost(postId);
    if (!error) setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const timeRemaining = (createdAt: number) => {
    const ms = (createdAt + 24 * 60 * 60 * 1000) - Date.now();
    if (ms <= 0) return 'Expiring...';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  const renderPostContent = (post: Post) => {
    switch (post.contentType) {
      case 'text':
        return <p className="text-white text-base leading-relaxed">{post.textContent}</p>;

      case 'image':
        return (
          <div className="space-y-3">
            {post.textContent && <p className="text-white text-sm leading-relaxed">{post.textContent}</p>}
            <div className="rounded-2xl overflow-hidden">
              <img src={post.mediaUrl} alt="Post" className="w-full object-cover max-h-80" />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            {post.textContent && <p className="text-white text-sm leading-relaxed">{post.textContent}</p>}
            <div className="rounded-2xl overflow-hidden">
              <video src={post.mediaUrl} controls className="w-full max-h-80" />
            </div>
          </div>
        );

      case 'scripture':
        return (
          <div className="space-y-3">
            {post.textContent && <p className="text-white/60 text-xs italic mb-2">{post.textContent}</p>}
            <div className="glass rounded-2xl p-6 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
              <span className="material-symbols-outlined text-primary text-2xl mb-2 block opacity-50">menu_book</span>
              <p className="text-white text-lg font-bold italic leading-relaxed">"{post.scriptureRef?.text}"</p>
              <p className="text-primary text-xs font-black uppercase tracking-widest mt-3">
                {post.scriptureRef?.book} {post.scriptureRef?.chapter}:{post.scriptureRef?.verse} (KJV)
              </p>
            </div>
          </div>
        );

      case 'wisdom':
        return (
          <div className="space-y-3">
            {post.textContent && <p className="text-white/60 text-xs italic mb-2">{post.textContent}</p>}
            <div className="glass rounded-2xl p-6 border-jamaican-gold/20 bg-gradient-to-br from-jamaican-gold/10 to-transparent">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl mb-2 block opacity-50">format_quote</span>
              <p className="text-white text-lg font-black italic leading-tight">"{post.wisdomRef?.patois}"</p>
              <div className="h-px w-10 bg-jamaican-gold/30 my-3"></div>
              <p className="text-white/50 text-sm italic">"{post.wisdomRef?.english}"</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Thought';
      case 'image': return 'Photo';
      case 'video': return 'Video';
      case 'scripture': return 'Scripture';
      case 'wisdom': return 'Wisdom';
      default: return type;
    }
  };

  return (
    <div className="min-h-full p-6 pb-24 animate-fade-in">
      <header className="pt-8 flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Community</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Feed</h2>
        </div>
        <button
          onClick={() => { if (user.isGuest) return; setShowCreate(true); }}
          className="size-12 rounded-2xl bg-primary text-background-dark flex items-center justify-center shadow-xl active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </header>

      {/* Posts */}
      <div className="space-y-6">
        {loading && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            <p className="text-white/30 text-xs uppercase mt-4 tracking-widest">Loading feed...</p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20 glass rounded-[3rem] border-dashed border-white/10">
            <span className="material-symbols-outlined text-6xl text-white/10 mb-4">dynamic_feed</span>
            <p className="text-white/20 text-sm font-black uppercase tracking-widest">No posts yet</p>
            <p className="text-white/10 text-xs mt-2">Be the first fi share a vibe!</p>
          </div>
        )}

        {posts.map(post => (
          <div key={post.id} className="glass rounded-[2rem] p-6 border-white/5 shadow-xl animate-fade-in">
            {/* Post header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-white/10 overflow-hidden">
                {post.avatarUrl ? (
                  <img src={post.avatarUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black">
                    {post.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm truncate">{post.username}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{typeLabel(post.contentType)}</span>
                  <span className="text-[8px] text-white/20">|</span>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{timeRemaining(post.createdAt)}</span>
                </div>
              </div>
              {post.userId === user.id && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="size-8 rounded-full glass flex items-center justify-center text-red-400/50 hover:text-red-400 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>

            {/* Post content */}
            {renderPostContent(post)}
          </div>
        ))}
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md" onClick={() => setShowCreate(false)}></div>
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass p-6 rounded-[2.5rem] border-white/10 shadow-2xl animate-scale-up">
            <h3 className="text-xl font-black text-white mb-5 uppercase tracking-tight">Create Post</h3>

            {/* Type Selector */}
            <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
              {(['text', 'image', 'video', 'scripture', 'wisdom'] as CreateType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setCreateType(t)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${createType === t ? 'bg-primary text-background-dark' : 'glass text-white/50'}`}
                >
                  {typeLabel(t)}
                </button>
              ))}
            </div>

            {/* Text input (always available) */}
            <textarea
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              placeholder={createType === 'text' ? "Wha pon yuh mind?" : "Add a caption (optional)..."}
              className="w-full h-24 glass rounded-2xl p-4 text-white text-sm placeholder:text-white/20 resize-none focus:border-primary/50 transition-colors bg-white/5 mb-4"
            />

            {/* Media picker */}
            {(createType === 'image' || createType === 'video') && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={createType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                {mediaPreview ? (
                  <div className="rounded-2xl overflow-hidden relative">
                    {createType === 'image' ? (
                      <img src={mediaPreview} className="w-full max-h-48 object-cover" alt="Preview" />
                    ) : (
                      <video src={mediaPreview} className="w-full max-h-48" controls />
                    )}
                    <button
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                      className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full glass rounded-2xl py-8 flex flex-col items-center gap-2 text-white/30 border-dashed border-white/10 active:scale-[0.98] transition-all"
                  >
                    <span className="material-symbols-outlined text-3xl">{createType === 'image' ? 'add_photo_alternate' : 'videocam'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Tap to select {createType}</span>
                  </button>
                )}
              </div>
            )}

            {/* Scripture picker */}
            {createType === 'scripture' && (
              <div className="mb-4 space-y-3">
                <select
                  value={scrBook}
                  onChange={e => { setScrBook(e.target.value); setScrChapter(1); setScrVerse(1); }}
                  className="w-full glass rounded-xl p-3 text-white text-sm bg-white/5 border-white/10"
                >
                  {Object.keys(BOOK_CHAPTERS).map(b => <option key={b} value={b} className="bg-background-dark">{b}</option>)}
                </select>
                <div className="flex gap-3">
                  <select
                    value={scrChapter}
                    onChange={e => { setScrChapter(Number(e.target.value)); setScrVerse(1); }}
                    className="flex-1 glass rounded-xl p-3 text-white text-sm bg-white/5 border-white/10"
                  >
                    {Array.from({ length: BOOK_CHAPTERS[scrBook] || 1 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-background-dark">Chapter {i + 1}</option>
                    ))}
                  </select>
                  <select
                    value={scrVerse}
                    onChange={e => setScrVerse(Number(e.target.value))}
                    className="flex-1 glass rounded-xl p-3 text-white text-sm bg-white/5 border-white/10"
                  >
                    {Array.from({ length: 50 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-background-dark">Verse {i + 1}</option>
                    ))}
                  </select>
                </div>
                {loadingVerse ? (
                  <p className="text-white/30 text-xs animate-pulse">Loading verse...</p>
                ) : (
                  <div className="glass rounded-xl p-4 border-primary/10">
                    <p className="text-white/80 text-sm italic">"{scrText}"</p>
                    <p className="text-primary text-[10px] font-black mt-2 uppercase tracking-widest">{scrBook} {scrChapter}:{scrVerse}</p>
                  </div>
                )}
              </div>
            )}

            {/* Wisdom picker */}
            {createType === 'wisdom' && (
              <div className="mb-4">
                {userWisdoms.length === 0 ? (
                  <div className="glass rounded-xl p-6 text-center">
                    <p className="text-white/30 text-xs font-bold uppercase">No wisdoms created yet</p>
                    <p className="text-white/15 text-[10px] mt-1">Go to Profile to pen yuh first wisdom</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userWisdoms.map((w, idx) => (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWisdomIdx(idx)}
                        className={`w-full text-left glass rounded-xl p-4 transition-all ${selectedWisdomIdx === idx ? 'border-jamaican-gold/40 bg-jamaican-gold/10' : 'border-white/5'}`}
                      >
                        <p className="text-white text-sm font-bold truncate">"{w.patois}"</p>
                        <p className="text-white/40 text-xs truncate mt-1">{w.english}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-4 glass rounded-2xl text-white/60 font-black text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={posting}
                className="flex-1 py-4 bg-primary text-background-dark rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post It'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
