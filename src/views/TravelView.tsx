import { User } from '../types';
import { TravelTab } from '../components/TravelBottomNav';
import MapsModule from './travel/MapsModule';
import AviationModule from './travel/AviationModule';
import FinancialPlannerModule from './travel/FinancialPlannerModule';
import TripPlannerModule from './travel/TripPlannerModule';

interface TravelViewProps {
  user: User;
  onBack: () => void;
  onGuestRestricted: () => void;
  travelTab: TravelTab;
  onTravelTabChange: (tab: TravelTab) => void;
}

const travelTabs: { id: TravelTab; label: string; icon: string }[] = [
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'aviation', label: 'Aviation Routes', icon: 'connecting_airports' },
  { id: 'planner', label: 'Financial Planner', icon: 'savings' },
  { id: 'tripplanner', label: 'My Trip', icon: 'route' }
];

const TravelView: React.FC<TravelViewProps> = ({ user, onBack, onGuestRestricted, travelTab, onTravelTabChange }) => {
  return (
    <section className="min-h-full pb-28 lg:pb-10">
      <header className="border-b border-white/10 bg-white/80 px-4 py-4 backdrop-blur-2xl dark:bg-background-dark/80 sm:px-6 lg:sticky lg:top-0 lg:z-[100] lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="glass flex size-11 shrink-0 items-center justify-center rounded-2xl text-slate-900/70 transition-colors hover:text-primary dark:text-white/70"
            aria-label="Back to home"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </button>

          <div className="min-w-0 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">flight</span>
              <h1 className="truncate text-2xl font-black uppercase tracking-tight text-slate-950 dark:text-white">Travel</h1>
            </div>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/40">Jamaica routes, maps, and money plans</p>
          </div>

          <div className="size-11 shrink-0" aria-hidden="true" />
        </div>

        <div className="mt-4 hidden gap-2 overflow-x-auto no-scrollbar rounded-2xl bg-slate-950/5 p-1 dark:bg-white/5 lg:flex" role="tablist" aria-label="Travel modules">
          {travelTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={travelTab === tab.id}
              onClick={() => onTravelTabChange(tab.id)}
              className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                travelTab === tab.id
                  ? 'bg-primary text-background-dark shadow-lg shadow-primary/20'
                  : 'text-slate-600 hover:text-slate-950 dark:text-white/50 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* All modules stay mounted; inactive ones are hidden with CSS.
          This preserves AI-generated content and form state when switching sub-tabs. */}
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div style={{ display: travelTab === 'maps' ? 'block' : 'none' }}>
          <MapsModule user={user} onGuestRestricted={onGuestRestricted} />
        </div>
        <div style={{ display: travelTab === 'aviation' ? 'block' : 'none' }}>
          <AviationModule />
        </div>
        <div style={{ display: travelTab === 'planner' ? 'block' : 'none' }}>
          <FinancialPlannerModule />
        </div>
        <div style={{ display: travelTab === 'tripplanner' ? 'block' : 'none' }}>
          <TripPlannerModule user={user} onGuestRestricted={onGuestRestricted} />
        </div>
      </div>
    </section>
  );
};

export default TravelView;
