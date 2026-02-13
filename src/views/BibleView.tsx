
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '../types';
import { useTTS } from '../hooks/useTTS';

interface BibleViewProps {
  user: User;
  isOnline: boolean;
  onBookmark: (verse: any) => void;
  onUpgrade: () => void;
}

interface BibleNote {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  note: string;
  highlightColor: string;
  timestamp: number;
}

const HIGHLIGHT_COLORS = [
  { name: 'Gold', value: 'bg-jamaican-gold/20 border-jamaican-gold/30', text: 'text-jamaican-gold', dot: 'bg-jamaican-gold' },
  { name: 'Green', value: 'bg-primary/20 border-primary/30', text: 'text-primary', dot: 'bg-primary' },
  { name: 'Blue', value: 'bg-blue-400/20 border-blue-400/30', text: 'text-blue-400', dot: 'bg-blue-400' },
  { name: 'Pink', value: 'bg-pink-400/20 border-pink-400/30', text: 'text-pink-400', dot: 'bg-pink-400' },
  { name: 'None', value: '', text: 'text-white/40', dot: 'bg-white/20' },
];

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

const BibleView: React.FC<BibleViewProps> = ({ user, isOnline, onBookmark, onUpgrade }) => {
  const [book, setBook] = useState('Psalms');
  const [chapter, setChapter] = useState(23);
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectorStage, setSelectorStage] = useState<'book' | 'chapter'>('book');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | { type: 'full'; book: string; bookIndex: number; totalBooks: number; chapter: number; totalChapters: number } | null>(null);
  const [isServingCache, setIsServingCache] = useState(false);
  const [fullBibleStashed, setFullBibleStashed] = useState(() => localStorage.getItem('kjv_full_bible_offline') === 'true');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { speak, stop, isSpeaking } = useTTS();

  // Bible Notes & Highlights state
  const [bibleNotes, setBibleNotes] = useState<BibleNote[]>(() => {
    try { return JSON.parse(localStorage.getItem(`bible_notes_${user.id}`) || '[]'); } catch { return []; }
  });
  const [showNotes, setShowNotes] = useState(false);
  const [activeVerseMenu, setActiveVerseMenu] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<{ book: string; chapter: number; verse: number; verseText: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('bg-jamaican-gold/20 border-jamaican-gold/30');
  const [notesSearch, setNotesSearch] = useState('');

  // Persist notes
  useEffect(() => {
    localStorage.setItem(`bible_notes_${user.id}`, JSON.stringify(bibleNotes));
  }, [bibleNotes, user.id]);

  const getVerseNote = useCallback((b: string, c: number, v: number): BibleNote | undefined => {
    return bibleNotes.find(n => n.book === b && n.chapter === c && n.verse === v);
  }, [bibleNotes]);

  const saveNote = () => {
    if (!editingNote) return;
    const existing = getVerseNote(editingNote.book, editingNote.chapter, editingNote.verse);
    if (noteText.trim() === '' && noteColor === '') {
      // Remove note if empty
      setBibleNotes(prev => prev.filter(n => n.id !== existing?.id));
    } else if (existing) {
      setBibleNotes(prev => prev.map(n => n.id === existing.id ? { ...n, note: noteText, highlightColor: noteColor, timestamp: Date.now() } : n));
    } else {
      const newNote: BibleNote = {
        id: `${editingNote.book}-${editingNote.chapter}-${editingNote.verse}-${Date.now()}`,
        book: editingNote.book,
        chapter: editingNote.chapter,
        verse: editingNote.verse,
        verseText: editingNote.verseText,
        note: noteText,
        highlightColor: noteColor,
        timestamp: Date.now()
      };
      setBibleNotes(prev => [...prev, newNote]);
    }
    setEditingNote(null);
    setNoteText('');
    setActiveVerseMenu(null);
  };

  const deleteNote = (noteId: string) => {
    setBibleNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const openNoteEditor = (v: any) => {
    const existing = getVerseNote(book, chapter, v.verse);
    setEditingNote({ book, chapter, verse: v.verse, verseText: v.text });
    setNoteText(existing?.note || '');
    setNoteColor(existing?.highlightColor || 'bg-jamaican-gold/20 border-jamaican-gold/30');
    setActiveVerseMenu(null);
  };

  const filteredNotes = useMemo(() => {
    let notes = [...bibleNotes].sort((a, b) => b.timestamp - a.timestamp);
    if (notesSearch.trim()) {
      const q = notesSearch.toLowerCase();
      notes = notes.filter(n => n.note.toLowerCase().includes(q) || n.verseText.toLowerCase().includes(q) || n.book.toLowerCase().includes(q) || `${n.book} ${n.chapter}:${n.verse}`.toLowerCase().includes(q));
    }
    return notes;
  }, [bibleNotes, notesSearch]);

  const books = Object.keys(BOOK_CHAPTERS);
  const filteredBooks = useMemo(() => books.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, books]);
  const maxChapters = BOOK_CHAPTERS[book] || 50;

  const cleanGodName = (text: string) => {
    if (!text) return text;
    return text.replace(/Yahweh/g, 'God').replace(/YAHWEH/g, 'GOD');
  };

  const getCacheKey = (b: string, c: number) => `kjv_cache_${b.replace(/\s/g, '_')}_${c}`;
  const isBookDownloaded = (b: string) => localStorage.getItem(`kjv_book_offline_${b.replace(/\s/g, '_')}`) === 'true';
  const isChapterCached = useCallback((b: string, ch: number) => !!localStorage.getItem(getCacheKey(b, ch)), []);
  const isFullBibleDownloaded = fullBibleStashed;

  const fetchBible = async () => {
    setLoading(true);
    setError(null);
    setIsServingCache(false);

    const cached = localStorage.getItem(getCacheKey(book, chapter));
    if (cached) {
      try {
        setVerses(JSON.parse(cached));
        setIsServingCache(true);
        setLoading(false);
        return;
      } catch { /* ignore cache error */ }
    }

    if (!isOnline) {
      setLoading(false);
      setError("No signal. Dis chapter nuh stashed yet — stash it when yuh have connection, or pick a book/chapter weh yuh already download.");
      return;
    }

    try {
      const formattedBook = book.replace(/\s/g, '+');
      const url = `https://bible-api.com/${formattedBook}+${chapter}?translation=kjv`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status === 404 ? `Chapter ${chapter} nuh exist.` : "Fetch error.");
      const data = await res.json();
      const fetchedVerses = (data.verses || []).map((v: any) => ({
        ...v,
        book_name: book,
        book_id: book.toLowerCase().replace(/\s/g, '_'),
        text: cleanGodName(v.text)
      }));
      setVerses(fetchedVerses);
      if (fetchedVerses.length > 0) localStorage.setItem(getCacheKey(book, chapter), JSON.stringify(fetchedVerses));
    } catch (e: any) {
      setError(e.message === 'Failed to fetch' ? "Network issues. Check connection." : e.message);
    } finally {
      setLoading(false);
    }
  };

  const playChapter = () => {
    if (isPlayingAudio) {
      stop();
      setIsPlayingAudio(false);
      return;
    }

    if (verses.length === 0) return;
    setIsPlayingAudio(true);

    let verseIndex = 0;
    const playNextVerse = () => {
      if (verseIndex < verses.length) {
        speak(verses[verseIndex].text, () => {
          verseIndex++;
          playNextVerse();
        });
      } else {
        if (chapter < maxChapters) {
          setChapter(prev => prev + 1);
        } else {
          const currentIndex = books.indexOf(book);
          if (currentIndex < books.length - 1) {
            setBook(books[currentIndex + 1]);
            setChapter(1);
          } else {
            setIsPlayingAudio(false);
          }
        }
      }
    };
    playNextVerse();
  };

  useEffect(() => {
    if (isPlayingAudio && !loading && verses.length > 0) {
      playChapter();
    }
  }, [verses, loading]);

  useEffect(() => { fetchBible(); }, [book, chapter]);

  const handleDownloadBook = async () => {
    if (!isOnline) return;
    const totalChapters = BOOK_CHAPTERS[book] || 1;
    setDownloading(true);
    setDownloadProgress({ current: 0, total: totalChapters });
    try {
      for (let i = 1; i <= totalChapters; i++) {
        setDownloadProgress({ current: i, total: totalChapters });
        const formattedBook = book.replace(/\s/g, '+');
        const res = await fetch(`https://bible-api.com/${formattedBook}+${i}?translation=kjv`);
        if (res.ok) {
          const data = await res.json();
          const clean = (data.verses || []).map((v: any) => ({ ...v, book_name: book, book_id: book.toLowerCase().replace(/\s/g, '_'), text: cleanGodName(v.text) }));
          localStorage.setItem(getCacheKey(book, i), JSON.stringify(clean));
        }
      }
      localStorage.setItem(`kjv_book_offline_${book.replace(/\s/g, '_')}`, 'true');
    } catch { /* ignore error */ } finally { setDownloading(false); setDownloadProgress(null); }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleDownloadFullBible = async () => {
    if (!isOnline) return;
    const bookList = Object.keys(BOOK_CHAPTERS);
    setDownloading(true);
    setDownloadProgress({ type: 'full', book: bookList[0], bookIndex: 1, totalBooks: bookList.length, chapter: 0, totalChapters: BOOK_CHAPTERS[bookList[0]] || 1 });
    try {
      for (let bi = 0; bi < bookList.length; bi++) {
        const b = bookList[bi];
        const totalChapters = BOOK_CHAPTERS[b] || 1;
        for (let ch = 1; ch <= totalChapters; ch++) {
          setDownloadProgress({ type: 'full', book: b, bookIndex: bi + 1, totalBooks: bookList.length, chapter: ch, totalChapters });
          try {
            const formattedBook = b.replace(/\s/g, '+');
            const res = await fetch(`https://bible-api.com/${formattedBook}+${ch}?translation=kjv`);
            if (res.ok) {
              const data = await res.json();
              const clean = (data.verses || []).map((v: any) => ({ ...v, book_name: b, book_id: b.toLowerCase().replace(/\s/g, '_'), text: cleanGodName(v.text) }));
              localStorage.setItem(getCacheKey(b, ch), JSON.stringify(clean));
            }
            await delay(180);
          } catch {
            // Skip this chapter and continue (e.g. rate limit or network); don't abort whole download
          }
        }
        localStorage.setItem(`kjv_book_offline_${b.replace(/\s/g, '_')}`, 'true');
      }
      localStorage.setItem('kjv_full_bible_offline', 'true');
      setFullBibleStashed(true);
    } catch { /* ignore */ } finally { setDownloading(false); setDownloadProgress(null); }
  };

  return (
    <div className="p-6 sm:p-10 pb-24 animate-fade-in font-display" role="region" aria-label="Bible reader">
      <header className="pt-12 mb-8 flex items-center justify-between" role="banner">
        <div>
          <span className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.4em]" aria-hidden="true">The Living Word</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">KJV Bible</h1>
        </div>
        <div className="flex gap-2">
          {/* My Bible Notes button */}
          <button
            onClick={() => setShowNotes(true)}
            className="size-14 sm:size-16 rounded-2xl glass flex items-center justify-center text-jamaican-gold relative shadow-xl"
            aria-label={bibleNotes.length > 0 ? `My Bible notes, ${bibleNotes.length} notes` : 'My Bible notes'}
          >
            <span className="material-symbols-outlined text-3xl sm:text-4xl font-black" aria-hidden="true">sticky_note_2</span>
            {bibleNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-jamaican-gold rounded-full flex items-center justify-center text-[9px] font-black text-background-dark" aria-hidden="true">{bibleNotes.length > 9 ? '9+' : bibleNotes.length}</span>
            )}
          </button>
          <button
            onClick={handleDownloadBook}
            disabled={downloading || isBookDownloaded(book) || !isOnline}
            className={`size-14 sm:size-16 rounded-2xl flex flex-col items-center justify-center shadow-xl transition-all ${isBookDownloaded(book) ? 'bg-primary/20 text-primary' : 'glass text-slate-900/40 dark:text-white/40'} ${!isOnline && !isBookDownloaded(book) ? 'opacity-20 cursor-not-allowed' : ''}`}
            aria-label={isBookDownloaded(book) ? `${book} stashed for offline` : `Stash ${book} for offline`}
          >
            <span className={`material-symbols-outlined text-3xl sm:text-4xl font-black ${downloading && downloadProgress && !('type' in downloadProgress) ? 'animate-bounce' : ''}`} aria-hidden="true">
              {isBookDownloaded(book) ? 'download_done' : 'cloud_download'}
            </span>
            {downloadProgress && !('type' in downloadProgress) && (
              <span className="text-[8px] font-black text-primary mt-0.5 leading-none">{downloadProgress.current}/{downloadProgress.total}</span>
            )}
          </button>
          <button
            onClick={playChapter}
            className={`size-14 sm:size-16 rounded-2xl flex items-center justify-center shadow-xl transition-all ${isPlayingAudio ? 'bg-primary text-background-dark' : 'glass text-primary'}`}
            aria-label={isPlayingAudio ? 'Stop reading aloud' : 'Play chapter aloud'}
          >
            <span className="material-symbols-outlined text-3xl sm:text-4xl font-black" aria-hidden="true">
              {isPlayingAudio ? 'stop_circle' : 'play_circle'}
            </span>
          </button>
          <button onClick={() => { setShowSelector(true); setSelectorStage('book'); }} className="size-14 sm:size-16 rounded-2xl bg-primary text-background-dark flex items-center justify-center shadow-xl" aria-label="Choose book and chapter">
            <span className="material-symbols-outlined text-3xl sm:text-4xl font-black" aria-hidden="true">search</span>
          </button>
        </div>
      </header>

      {/* Book/Chapter Selector */}
      {showSelector && (
        <div className="fixed inset-0 z-[110] bg-background-dark/95 backdrop-blur-xl animate-fade-in p-6 sm:p-12 flex flex-col items-center" role="dialog" aria-modal="true" aria-labelledby="bible-selector-title">
          <div className="w-full max-w-2xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 id="bible-selector-title" className="text-2xl sm:text-4xl font-black text-white">{selectorStage === 'book' ? 'Select Book' : `Select Chapter - ${book}`}</h2>
              <button onClick={() => { setShowSelector(false); setSelectorStage('book'); }} className="size-12 sm:size-16 rounded-full glass flex items-center justify-center text-white" aria-label="Close book and chapter selector"><span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span></button>
            </div>
            {selectorStage === 'book' && (
              <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 text-2xl">search</span>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Type book name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
              </div>
            )}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
              {selectorStage === 'book' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredBooks.map(b => (
                    <button key={b} onClick={() => { setBook(b); setSelectorStage('chapter'); setSearchQuery(''); }} className={`p-5 sm:p-7 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest text-left transition-all ${book === b ? 'bg-primary text-background-dark' : 'glass text-white/40 hover:text-white'}`}>
                      {b} {isBookDownloaded(b) && <span className="material-symbols-outlined text-xs sm:text-sm align-middle ml-1">offline_pin</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {Array.from({ length: maxChapters }).map((_, i) => {
                    const ch = i + 1;
                    const cached = isChapterCached(book, ch);
                    const offlineUnavailable = !isOnline && !cached;
                    return (
                      <button
                        key={i}
                        onClick={() => { setChapter(ch); setShowSelector(false); setSelectorStage('book'); }}
                        disabled={offlineUnavailable}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black text-lg sm:text-2xl transition-all relative ${chapter === ch ? 'bg-primary text-background-dark' : offlineUnavailable ? 'glass text-white/20 cursor-not-allowed' : 'glass text-white/40 hover:text-white'}`}
                      >
                        {ch}
                        {cached && <span className="material-symbols-outlined text-[10px] text-primary absolute bottom-1 right-1" title="Available offline">offline_pin</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stash whole Bible for offline */}
      {!isFullBibleDownloaded && isOnline && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleDownloadFullBible}
            disabled={downloading}
            className="glass rounded-2xl px-6 py-4 flex items-center gap-4 border border-primary/20 hover:border-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed w-full max-w-md mx-auto"
          >
            <span className={`material-symbols-outlined text-2xl text-primary ${downloading && downloadProgress && 'type' in downloadProgress ? 'animate-bounce' : ''}`}>
              {isFullBibleDownloaded ? 'download_done' : 'menu_book'}
            </span>
            <div className="flex-1 text-left">
              {downloadProgress && 'type' in downloadProgress ? (
                <>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">Stashing whole Bible...</p>
                  <p className="text-xs text-white/70 font-bold">{downloadProgress.book} {downloadProgress.chapter}/{downloadProgress.totalChapters} · Book {downloadProgress.bookIndex}/{downloadProgress.totalBooks}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">Stash whole Bible</p>
                  <p className="text-[9px] font-bold text-white/50">Download KJV for full offline readin'</p>
                </>
              )}
            </div>
          </button>
        </div>
      )}
      {isFullBibleDownloaded && (
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="bg-primary/10 border border-primary/20 px-6 py-2 rounded-full flex items-center gap-3 shadow-lg">
            <span className="material-symbols-outlined text-primary text-sm">menu_book</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-primary tracking-widest leading-none">Whole Bible stashed</span>
              <span className="text-[7px] font-bold uppercase text-primary/60 tracking-widest">Full KJV available offline</span>
            </div>
          </div>
        </div>
      )}
      {isServingCache && !isFullBibleDownloaded && (
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="bg-primary/10 border border-primary/20 px-6 py-2 rounded-full flex items-center gap-3 shadow-lg">
            <span className="material-symbols-outlined text-primary text-sm animate-pulse">offline_pin</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-primary tracking-widest leading-none">Vibe Vault Access</span>
              <span className="text-[7px] font-bold uppercase text-primary/60 tracking-widest">Stashed fi offline readin'</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8 max-w-2xl mx-auto">
        <button onClick={() => setChapter(Math.max(1, chapter - 1))} className="size-14 sm:size-16 rounded-2xl glass flex items-center justify-center text-primary"><span className="material-symbols-outlined text-3xl sm:text-4xl">chevron_left</span></button>
        <div onClick={() => { setShowSelector(true); setSelectorStage('book'); }} className="flex-1 glass h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/20 transition-all">
          <span className="text-[9px] sm:text-[11px] font-black uppercase text-primary/60">{book}</span>
          <span className="font-black text-xl sm:text-2xl leading-none text-slate-900 dark:text-white">Chapter {chapter}</span>
        </div>
        <button onClick={() => setChapter(Math.min(maxChapters, chapter + 1))} className="size-14 sm:size-16 rounded-2xl glass flex items-center justify-center text-primary"><span className="material-symbols-outlined text-3xl sm:text-4xl">chevron_right</span></button>
      </div>

      {/* Verses */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="py-24 text-center"><span className="material-symbols-outlined text-5xl text-primary animate-spin">sync</span></div>
        ) : error ? (
          <div className="py-20 text-center glass rounded-[2.5rem] p-10 border-red-500/20 shadow-2xl bg-red-500/5">
            <span className="material-symbols-outlined text-5xl text-red-400 mb-6">cloud_off</span>
            <p className="text-red-400 font-black uppercase text-sm tracking-widest mb-2 leading-relaxed">{error}</p>
            {isOnline && <button onClick={fetchBible} className="mt-8 w-full max-w-xs mx-auto bg-primary text-background-dark py-5 rounded-2xl uppercase font-black text-xs tracking-[0.2em] shadow-xl">Try Again</button>}
          </div>
        ) : (
          verses.map(v => {
            const verseNote = getVerseNote(book, chapter, v.verse);
            const highlightClass = verseNote?.highlightColor || '';
            return (
              <div
                key={v.verse}
                className={`glass p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 relative group transition-all shadow-xl animate-fade-in ${highlightClass}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-8 sm:size-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><span className="text-[12px] sm:text-[14px] font-black text-primary">{v.verse}</span></div>
                    <span className="text-[10px] sm:text-[12px] font-black text-slate-900/40 dark:text-white/40 uppercase tracking-widest">{book} {chapter}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Highlight/Note button */}
                    <button
                      onClick={() => setActiveVerseMenu(activeVerseMenu === v.verse ? null : v.verse)}
                      className={`size-10 sm:size-12 rounded-xl glass flex items-center justify-center transition-all ${verseNote ? 'text-jamaican-gold' : 'text-slate-900/20 dark:text-white/20 group-hover:text-jamaican-gold'}`}
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl">{verseNote?.note ? 'edit_note' : 'highlight'}</span>
                    </button>
                    {/* Bookmark */}
                    <button onClick={() => onBookmark(v)} className="size-10 sm:size-12 rounded-xl glass text-slate-900/20 dark:text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all flex items-center justify-center"><span className="material-symbols-outlined text-xl sm:text-2xl">bookmark</span></button>
                  </div>
                </div>

                <p className="text-slate-900 dark:text-white text-xl sm:text-2xl leading-relaxed font-medium">{v.text}</p>

                {/* Show note preview if exists */}
                {verseNote?.note && (
                  <div className="mt-4 flex items-start gap-2 bg-black/10 dark:bg-white/5 rounded-xl px-4 py-3" onClick={() => openNoteEditor(v)}>
                    <span className="material-symbols-outlined text-jamaican-gold text-sm mt-0.5 shrink-0">sticky_note_2</span>
                    <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{verseNote.note}</p>
                  </div>
                )}

                {/* Verse action menu */}
                {activeVerseMenu === v.verse && (
                  <div className="mt-4 glass rounded-2xl p-4 border-white/10 animate-fade-in space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Highlight Color</span>
                    </div>
                    <div className="flex gap-2">
                      {HIGHLIGHT_COLORS.map(c => (
                        <button
                          key={c.name}
                          onClick={() => {
                            const existing = getVerseNote(book, chapter, v.verse);
                            if (c.value === '' && existing) {
                              setBibleNotes(prev => prev.map(n => n.id === existing.id ? { ...n, highlightColor: '' } : n));
                            } else if (existing) {
                              setBibleNotes(prev => prev.map(n => n.id === existing.id ? { ...n, highlightColor: c.value } : n));
                            } else {
                              setBibleNotes(prev => [...prev, {
                                id: `${book}-${chapter}-${v.verse}-${Date.now()}`,
                                book, chapter, verse: v.verse, verseText: v.text,
                                note: '', highlightColor: c.value, timestamp: Date.now()
                              }]);
                            }
                            setActiveVerseMenu(null);
                          }}
                          className={`size-8 rounded-full ${c.dot} border-2 ${verseNote?.highlightColor === c.value ? 'border-white ring-2 ring-white/30' : 'border-transparent'} transition-all active:scale-90`}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => openNoteEditor(v)}
                      className="w-full py-3 glass rounded-xl text-white/80 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      {verseNote?.note ? 'Edit Note' : 'Add Note'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Note Editor Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md" onClick={() => { setEditingNote(null); setNoteText(''); }}></div>
          <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto glass p-6 rounded-t-[2.5rem] sm:rounded-[2.5rem] border-white/10 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Verse Note</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{editingNote.book} {editingNote.chapter}:{editingNote.verse}</p>
              </div>
              <button onClick={() => { setEditingNote(null); setNoteText(''); }} className="size-10 rounded-full glass flex items-center justify-center text-white/40">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="glass rounded-xl p-4 mb-4 border-white/5">
              <p className="text-white/60 text-sm italic leading-relaxed line-clamp-3">"{editingNote.verseText}"</p>
            </div>

            <div className="mb-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Highlight</label>
              <div className="flex gap-2">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setNoteColor(c.value)}
                    className={`size-8 rounded-full ${c.dot} border-2 ${noteColor === c.value ? 'border-white ring-2 ring-white/30' : 'border-transparent'} transition-all active:scale-90`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Your Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write yuh thoughts pon dis verse..."
                className="w-full h-32 glass rounded-2xl p-4 text-white placeholder:text-white/10 resize-none focus:border-primary/50 transition-colors bg-white/5"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setEditingNote(null); setNoteText(''); }} className="flex-1 py-4 glass rounded-2xl text-white/60 font-black text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={saveNote} className="flex-1 py-4 bg-primary text-background-dark rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* My Bible Notes Full Page */}
      {showNotes && (
        <div className="fixed inset-0 z-[200] bg-background-dark animate-fade-in flex flex-col">
          <div className="flex items-center justify-between px-6 pt-safe pb-4 border-b border-white/5 shrink-0">
            <button onClick={() => setShowNotes(false)} className="size-10 rounded-full glass flex items-center justify-center text-white/60 active:scale-95 transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">My Bible Notes</h3>
            <div className="size-10 rounded-full glass flex items-center justify-center text-jamaican-gold">
              <span className="material-symbols-outlined text-xl">sticky_note_2</span>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-4 shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xl">search</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Search notes, verses..."
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-safe">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <span className="material-symbols-outlined text-5xl text-white/10 mb-4">sticky_note_2</span>
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">
                  {notesSearch ? 'No notes match yuh search' : 'No notes yet'}
                </p>
                <p className="text-white/10 text-[10px] mt-1">Tap di highlight icon on any verse fi start</p>
              </div>
            ) : (
              <div className="space-y-4 pb-8">
                {filteredNotes.map(note => (
                  <div key={note.id} className={`glass rounded-2xl p-5 border-white/5 shadow-lg ${note.highlightColor} animate-fade-in`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <button
                          onClick={() => { setBook(note.book); setChapter(note.chapter); setShowNotes(false); }}
                          className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                        >
                          {note.book} {note.chapter}:{note.verse}
                        </button>
                        <p className="text-white/30 text-[8px] font-bold uppercase tracking-wider mt-0.5">
                          {new Date(note.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this note?')) deleteNote(note.id); }}
                        className="size-8 rounded-full glass flex items-center justify-center text-red-400/40 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                    <p className="text-white/50 text-xs italic leading-relaxed mb-3 line-clamp-2">"{note.verseText}"</p>
                    {note.note && (
                      <div className="bg-black/10 dark:bg-white/5 rounded-xl px-4 py-3">
                        <p className="text-white/80 text-sm leading-relaxed">{note.note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleView;
