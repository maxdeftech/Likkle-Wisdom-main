
import React from 'react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onOpenFriends: () => void;
  onOpenWisdomCreator: () => void;
  unreadMessageCount?: number;
  pendingRequestCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, onOpenFriends, onOpenWisdomCreator, unreadMessageCount = 0, pendingRequestCount = 0 }) => {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'feed', label: 'Feed', icon: 'dynamic_feed' },
    { id: 'bible', label: 'Bible', icon: 'auto_stories' },
    { id: 'book', label: 'Journal', icon: 'edit_note' },
    { id: 'me', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-auto min-h-[4rem] pb-safe glass border-t border-white/10 z-dropdown flex items-center justify-around px-2 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
          className={`flex flex-col items-center gap-0.5 transition-all duration-300 flex-1 py-1 ${activeTab === tab.id ? 'text-primary' : 'text-slate-900/40 dark:text-white/40'
            }`}
        >
          <div className={`transition-all duration-300 ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`}>
            <span className={`material-symbols-outlined text-[24px] ${activeTab === tab.id ? 'fill-1' : ''}`}>
              {tab.icon}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter sm:tracking-widest">{tab.label}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-0.5"></div>

      {/* Friends List */}
      <button
        onClick={onOpenFriends}
        aria-label="My Friends"
        className="flex flex-col items-center gap-0.5 transition-all duration-300 flex-1 py-1 text-slate-900/40 dark:text-white/40 relative"
      >
        <span className="material-symbols-outlined text-[24px]">group</span>
        <span className="text-[9px] font-black uppercase tracking-tighter sm:tracking-widest">Friends</span>
      </button>

      {/* Wisdom Creator */}
      <button
        onClick={onOpenWisdomCreator}
        aria-label="Create Wisdom"
        className="flex flex-col items-center gap-0.5 transition-all duration-300 flex-1 py-1 text-slate-900/40 dark:text-white/40"
      >
        <span className="material-symbols-outlined text-[24px]">edit_square</span>
        <span className="text-[9px] font-black uppercase tracking-tighter sm:tracking-widest">Create</span>
      </button>
    </nav>
  );
};

export default BottomNav;
