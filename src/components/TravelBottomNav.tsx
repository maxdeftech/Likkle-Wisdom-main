import React from 'react';

export type TravelTab = 'maps' | 'aviation' | 'planner';

interface TravelBottomNavProps {
  activeTab: TravelTab;
  onTabChange: (tab: TravelTab) => void;
  onBack: () => void;
}

const tabs: { id: TravelTab; label: string; icon: string }[] = [
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'aviation', label: 'Routes', icon: 'connecting_airports' },
  { id: 'planner', label: 'Planner', icon: 'savings' }
];

const navButtonClass = (active = false) => `relative flex size-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
  active
    ? 'bg-white text-[#07120a] shadow-[0_0_0_2px_rgba(244,209,37,0.74),0_10px_22px_rgba(0,0,0,0.35)]'
    : 'text-white/70 hover:text-primary'
}`;

const TravelBottomNav: React.FC<TravelBottomNavProps> = ({ activeTab, onTabChange, onBack }) => (
  <nav className="pointer-events-none fixed bottom-[max(0.85rem,env(safe-area-inset-bottom))] left-1/2 z-[9000] w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 lg:hidden" aria-label="Travel navigation">
    <div
      className="pointer-events-auto relative flex h-[70px] items-center justify-around rounded-full border border-primary/15 bg-[#07120a]/95 px-3 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:border before:border-white/5"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to Likkle Wisdom"
        className={navButtonClass(false)}
      >
        <span className="material-symbols-outlined text-[25px]" aria-hidden="true">home</span>
        <span className="sr-only">Home</span>
      </button>

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
              <span className="material-symbols-outlined text-[25px]" aria-hidden="true">{tab.icon}</span>
            </span>
            <span className="sr-only">{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default TravelBottomNav;
