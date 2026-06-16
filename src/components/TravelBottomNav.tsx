import React from 'react';

export type TravelTab = 'info' | 'maps' | 'aviation' | 'planner' | 'tripplanner';

interface TravelBottomNavProps {
  activeTab: TravelTab;
  onTabChange: (tab: TravelTab) => void;
}

const tabs: { id: TravelTab; label: string; icon: string }[] = [
  { id: 'info', label: 'Info', icon: 'shield' },
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'aviation', label: 'Routes', icon: 'connecting_airports' },
  { id: 'planner', label: 'Finance', icon: 'savings' },
  { id: 'tripplanner', label: 'My Trip', icon: 'route' }
];

const navButtonClass = (active = false) => `relative flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
  active
    ? 'bg-white text-[#07120a] shadow-[0_0_0_2px_rgba(244,209,37,0.74),0_10px_22px_rgba(0,0,0,0.35)]'
    : 'text-white/70 hover:text-primary'
}`;

const TravelBottomNav: React.FC<TravelBottomNavProps> = ({ activeTab, onTabChange }) => (
  <nav className="pointer-events-none fixed bottom-[max(0.7rem,env(safe-area-inset-bottom))] left-1/2 z-[9000] w-[calc(100%-1.5rem)] max-w-[380px] -translate-x-1/2 lg:hidden" aria-label="Travel navigation">
    <div
      className="pointer-events-auto relative flex h-[60px] items-center justify-around rounded-full border border-primary/15 bg-[#07120a]/95 px-2 shadow-[0_14px_34px_rgba(0,0,0,0.42)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:border before:border-white/5"
    >
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
            className={navButtonClass(active)}
          >
            <span className="relative z-10">
              <span className="material-symbols-outlined text-[23px]" aria-hidden="true">{tab.icon}</span>
            </span>
            <span className="sr-only">{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default TravelBottomNav;
