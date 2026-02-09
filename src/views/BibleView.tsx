
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { useTTS } from '../hooks/useTTS';

interface BibleViewProps {
  user: User;
  isOnline: boolean;
  onBookmark: (verse: any) => void;
  onUpgrade: () => void;
}

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
  const [isServingCache, setIsServingCache] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { speak, stop, isSpeaking } = useTTS();

  const books = Object.keys(BOOK_CHAPTERS);
  const filteredBooks = useMemo(() => books.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, books]);
  const maxChapters = BOOK_CHAPTERS[book] || 50;

  const cleanGodName = (text: string) => {
    if (!text) return text;
    return text.replace(/Yahweh/g, 'God').replace(/YAHWEH/g, 'GOD');
  };

  const getCacheKey = (b: string, c: number) => `kjv_cache_${b.replace(/\s/g, '_')}_${c}`;
  const isBookDownloaded = (b: string) => localStorage.getItem(`kjv_book_offline_${b.replace(/\s/g, '_')}`) === 'true';

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
      setError("No signal. Chapter nuh stashed fi offline use.");
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
      if (user.isPremium && fetchedVerses.length > 0) localStorage.setItem(getCacheKey(book, chapter), JSON.stringify(fetchedVerses));
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
        // Next Chapter Auto-play
        if (chapter < maxChapters) {
          setChapter(prev => prev + 1);
        } else {
          // Next Book Auto-play
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
      playChapter(); // Re-trigger for next chapter
    }
  }, [verses, loading]);

  useEffect(() => { fetchBible(); }, [book, chapter]);

  const handleDownloadBook = async () => {
    if (!isOnline) return;
    if (!user.isPremium) { onUpgrade(); return; }
    setDownloading(true);
    try {
      const chaptersToDownload = Math.min(BOOK_CHAPTERS[book] || 1, 10);
      for (let i = 1; i <= chaptersToDownload; i++) {
        const formattedBook = book.replace(/\s/g, '+');
        const res = await fetch(`https://bible-api.com/${formattedBook}+${i}?translation=kjv`);
        if (res.ok) {
          const data = await res.json();
          const clean = (data.verses || []).map((v: any) => ({ ...v, book_name: book, book_id: book.toLowerCase().replace(/\s/g, '_'), text: cleanGodName(v.text) }));
          localStorage.setItem(getCacheKey(book, i), JSON.stringify(clean));
        }
      }
      localStorage.setItem(`kjv_book_offline_${book.replace(/\s/g, '_')}`, 'true');
    } catch { /* ignore error */ } finally { setDownloading(false); }
  };

  return (
    <div className="p-6 sm:p-10 pb-24 animate-fade-in font-display">
      <header className="pt-12 mb-8 flex items-center justify-between">
        <div>
          <span className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.4em]">The Living Word</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">KJV Bible</h1>
        </div>
        <div className="flex gap-2">
          {user.isPremium && (
            <button
              onClick={handleDownloadBook}
              disabled={downloading || isBookDownloaded(book) || !isOnline}
              className={`size-14 sm:size-16 rounded-2xl flex items-center justify-center shadow-xl transition-all ${isBookDownloaded(book) ? 'bg-primary/20 text-primary' : 'glass text-slate-900/40 dark:text-white/40'} ${!isOnline && !isBookDownloaded(book) ? 'opacity-20 cursor-not-allowed' : ''}`}
            >
              <span className={`material-symbols-outlined text-3xl sm:text-4xl font-black ${downloading ? 'animate-bounce' : ''}`}>
                {isBookDownloaded(book) ? 'download_done' : 'cloud_download'}
              </span>
            </button>
          )}
          <button
            onClick={playChapter}
            className={`size-14 sm:size-16 rounded-2xl flex items-center justify-center shadow-xl transition-all ${isPlayingAudio ? 'bg-primary text-background-dark' : 'glass text-primary'}`}
          >
            <span className="material-symbols-outlined text-3xl sm:text-4xl font-black">
              {isPlayingAudio ? 'stop_circle' : 'play_circle'}
            </span>
          </button>
          <button onClick={() => { setShowSelector(true); setSelectorStage('book'); }} className="size-14 sm:size-16 rounded-2xl bg-primary text-background-dark flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-3xl sm:text-4xl font-black">search</span>
          </button>
        </div>
      </header>

      {showSelector && (
        <div className="fixed inset-0 z-[110] bg-background-dark/95 backdrop-blur-xl animate-fade-in p-6 sm:p-12 flex flex-col items-center">
          <div className="w-full max-w-2xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-4xl font-black text-white">{selectorStage === 'book' ? 'Select Book' : `Select Chapter - ${book}`}</h2>
              <button onClick={() => { setShowSelector(false); setSelectorStage('book'); }} className="size-12 sm:size-16 rounded-full glass flex items-center justify-center text-white"><span className="material-symbols-outlined text-2xl">close</span></button>
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
                  {Array.from({ length: maxChapters }).map((_, i) => (
                    <button key={i} onClick={() => { setChapter(i + 1); setShowSelector(false); setSelectorStage('book'); }} className={`aspect-square rounded-2xl flex items-center justify-center font-black text-lg sm:text-2xl transition-all ${chapter === i + 1 ? 'bg-primary text-background-dark' : 'glass text-white/40 hover:text-white'}`}>{i + 1}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isServingCache && (
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
          verses.map(v => (
            <div key={v.verse} className="glass p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 relative group hover:border-primary/30 transition-all shadow-xl animate-fade-in">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-8 sm:size-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><span className="text-[12px] sm:text-[14px] font-black text-primary">{v.verse}</span></div>
                  <span className="text-[10px] sm:text-[12px] font-black text-slate-900/40 dark:text-white/40 uppercase tracking-widest">{book} {chapter}</span>
                </div>
                <button onClick={() => onBookmark(v)} className="size-10 sm:size-12 rounded-xl glass text-slate-900/20 dark:text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all flex items-center justify-center"><span className="material-symbols-outlined text-xl sm:text-2xl">bookmark</span></button>
              </div>
              <p className="text-slate-900 dark:text-white text-xl sm:text-2xl leading-relaxed font-medium">{v.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BibleView;
