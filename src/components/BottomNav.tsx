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
    { id: 'bible', label: 'Bible', icon: 'auto_stories' },
    { id: 'book', label: 'Journal', icon: 'edit_note' },
    { id: 'travel', label: 'Travel', icon: 'flight' },
    { id: 'me', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav
      className={`fixed z-dropdown glass border-white/10 shadow-2xl transition-all duration-300
        bottom-0 left-0 right-0 min-h-[4rem] pb-safe border-t flex items-center justify-around px-2 rounded-t-2xl
        lg:top-0 lg:bottom-0 lg:right-auto lg:h-screen lg:min-h-0 lg:pb-0 lg:pt-safe lg:border-t-0 lg:border-r lg:rounded-none lg:flex-col lg:justify-start lg:items-stretch lg:gap-2 lg:px-3 lg:py-5
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
            className={`flex flex-col items-center gap-0.5 transition-all duration-300 flex-1 py-1 rounded-2xl
              lg:flex-none lg:h-14 lg:flex-row lg:justify-start lg:px-4 lg:gap-3
              ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
              ${activeTab === tab.id ? 'text-primary lg:bg-primary/10 lg:border lg:border-primary/20' : 'text-slate-900/40 dark:text-white/40 lg:hover:text-slate-900 lg:dark:hover:text-white lg:hover:bg-white/5'}`}
          >
            <div className={`transition-all duration-300 ${activeTab === tab.id ? 'scale-110 lg:scale-100' : 'scale-100'}`}>
              <span className={`material-symbols-outlined text-[24px] ${activeTab === tab.id ? 'fill-1' : ''}`} aria-hidden="true">
                {tab.icon}
              </span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter sm:tracking-widest lg:text-[11px] lg:tracking-[0.16em] ${isCollapsed ? 'lg:sr-only' : ''}`}>
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
