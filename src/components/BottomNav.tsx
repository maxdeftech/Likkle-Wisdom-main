import React from 'react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, isCollapsed, onToggleCollapsed, onOpenSettings, onSignOut }) => {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'discover', label: 'Discover', icon: 'explore' },
    { id: 'guide', label: 'Guide', icon: 'smart_toy' },
    { id: 'bible', label: 'Bible', icon: 'auto_stories' },
    { id: 'book', label: 'Journal', icon: 'edit_note' },
    { id: 'travel', label: 'Travel', icon: 'flight' },
    { id: 'me', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav
      className={`fixed z-dropdown bottom-[max(0.85rem,env(safe-area-inset-bottom))] left-1/2 right-auto flex h-[70px] w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center justify-around rounded-full border border-primary/15 bg-[#07120a]/95 px-3 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:border before:border-white/5
        lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-screen lg:min-h-0 lg:max-w-none lg:translate-x-0 lg:rounded-none lg:border-t-0 lg:border-r lg:border-white/10 lg:bg-white/5 lg:px-3 lg:py-5 lg:pt-safe lg:shadow-2xl lg:backdrop-blur-[16px] lg:before:hidden lg:flex-col lg:justify-start lg:items-stretch lg:gap-2
        ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}`}
      aria-label="Main navigation"
    >
      <div className="hidden lg:flex items-center justify-between px-2 py-3">
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Likkle</p>
            <p className="truncate text-xl font-black text-slate-900 dark:text-white">Wisdom</p>
          </div>
        )}
        <button
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!isCollapsed}
          className="size-11 rounded-2xl glass flex items-center justify-center text-slate-900/70 dark:text-white/70 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>

      <div className="contents lg:flex lg:flex-col lg:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            title={isCollapsed ? tab.label : undefined}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full transition-all duration-300
              lg:size-auto lg:flex-none lg:h-14 lg:flex-row lg:justify-start lg:px-4 lg:gap-3 lg:rounded-2xl
              ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
              ${activeTab === tab.id ? 'bg-white text-[#07120a] shadow-[0_0_0_2px_rgba(244,209,37,0.74),0_10px_22px_rgba(0,0,0,0.35)] lg:border lg:border-primary/20 lg:bg-primary/10 lg:text-primary lg:shadow-none' : 'text-white/70 hover:text-primary lg:text-slate-900/40 lg:hover:bg-white/5 lg:hover:text-slate-900 dark:lg:text-white/40 lg:dark:hover:text-white'}`}
          >
            <div className="transition-all duration-300">
              <span className={`material-symbols-outlined text-[25px] lg:text-[24px] ${activeTab === tab.id ? 'lg:fill-1' : ''}`} aria-hidden="true">
                {tab.icon}
              </span>
            </div>
            <span className={`sr-only lg:not-sr-only lg:text-[11px] lg:font-black lg:uppercase lg:tracking-[0.16em] ${isCollapsed ? 'lg:sr-only' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-2 lg:border-t lg:border-white/10 lg:px-0 lg:pt-4">
        <button
          onClick={onOpenSettings}
          aria-label="Open settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={`h-14 rounded-2xl text-slate-900/40 dark:text-white/40 transition-all lg:flex lg:items-center lg:gap-3 lg:px-4 lg:hover:text-slate-900 lg:dark:hover:text-white lg:hover:bg-white/5 ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
        >
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">settings</span>
          <span className={`text-[11px] font-black uppercase tracking-[0.16em] ${isCollapsed ? 'lg:sr-only' : ''}`}>Settings</span>
        </button>
        <button
          onClick={onSignOut}
          aria-label="Log out"
          title={isCollapsed ? 'Log out' : undefined}
          className={`h-14 rounded-2xl text-red-400/80 transition-all lg:flex lg:items-center lg:gap-3 lg:px-4 lg:hover:bg-red-400/10 lg:hover:text-red-300 ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
        >
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">logout</span>
          <span className={`text-[11px] font-black uppercase tracking-[0.16em] ${isCollapsed ? 'lg:sr-only' : ''}`}>Log out</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
