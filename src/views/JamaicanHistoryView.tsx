import React, { useRef } from 'react';
import {
  NATIONAL_HEROES,
  ICONIC_PLACES,
  CURRENCY_IMAGES,
  BRITISH_RULE,
  TAINOS,
  COLUMBUS_IN_JAMAICA,
  SLAVERY_AND_OVERCOMING,
  MUSEUMS,
  PERSONS_LIKE_MS_LOU,
  JAMAICAN_CUISINE,
  NATIONAL_SYMBOLS,
} from '../data/jamaicanHistory';

interface JamaicanHistoryViewProps {
  onClose: () => void;
}

const SectionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => (
  <div
    className={`glass rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl overflow-hidden animate-fade-in ${className}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {children}
  </div>
);

const ImageBlock: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
  <div className={`rounded-2xl overflow-hidden border border-white/10 shadow-lg ${className}`}>
    <img src={src} alt={alt} className="w-full h-48 sm:h-56 object-cover" loading="lazy" />
  </div>
);

const JamaicanHistoryView: React.FC<JamaicanHistoryViewProps> = ({ onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed inset-0 z-overlay bg-white dark:bg-background-dark flex flex-col font-display overflow-hidden animate-fade-in" role="article" aria-label="Jamaican History">
      <header className="sticky top-0 z-sticky flex items-center gap-3 px-4 py-4 glass backdrop-blur-md border-b border-white/5">
        <button
          onClick={onClose}
          aria-label="Back to Discover"
          className="size-12 rounded-2xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">Jamaican History</h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Land of wood and water</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Hero */}
          <div className="text-center py-8 animate-fade-in">
            <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-gradient-to-br from-jamaican-gold to-primary/30 border border-jamaican-gold/30 mb-6 animate-float">
              <span className="material-symbols-outlined text-4xl text-white">flag</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-md mx-auto">
              From the Taínos to Independence — heroes, places, culture, and how we overcame.
            </p>
          </div>

          {/* National Heroes */}
          <SectionCard delay={100}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">military_tech</span>
              National Heroes
            </h2>
            <div className="space-y-4">
              {NATIONAL_HEROES.map((hero, i) => (
                <div key={hero.name} className="pl-4 border-l-2 border-primary/30 py-1">
                  <p className="font-black text-slate-900 dark:text-white">{hero.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{hero.role} · {hero.year}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{hero.blurb}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Iconic Places */}
          <SectionCard delay={150}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">landscape</span>
              Iconic Places
            </h2>
            <div className="space-y-6">
              {ICONIC_PLACES.map((place) => (
                <div key={place.name} className="space-y-3">
                  <ImageBlock src={place.image} alt={place.name} />
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{place.name}</p>
                    <p className="text-[10px] font-bold text-jamaican-gold/80 uppercase tracking-wider">{place.established}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{place.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Currency */}
          <SectionCard delay={200}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">payments</span>
              Jamaican Currency Through Time
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              From older banknotes and the Jamaican pound to the modern Jamaican dollar (JMD).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CURRENCY_IMAGES.map((c) => (
                <div key={c.label} className="rounded-xl overflow-hidden border border-white/10">
                  <img src={c.url} alt={c.label} className="w-full h-32 object-cover" loading="lazy" />
                  <p className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center">{c.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* British Rule */}
          <SectionCard delay={250}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">account_balance</span>
              {BRITISH_RULE.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{BRITISH_RULE.intro}</p>
            <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-300">
              {BRITISH_RULE.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </SectionCard>

          {/* Tainos */}
          <SectionCard delay={300}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">history_edu</span>
              {TAINOS.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{TAINOS.intro}</p>
            <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-300">
              {TAINOS.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </SectionCard>

          {/* Columbus */}
          <SectionCard delay={350}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">sailing</span>
              {COLUMBUS_IN_JAMAICA.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{COLUMBUS_IN_JAMAICA.intro}</p>
            <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-300">
              {COLUMBUS_IN_JAMAICA.impact.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </SectionCard>

          {/* Slavery & Overcoming */}
          <SectionCard delay={400}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">favorite</span>
              {SLAVERY_AND_OVERCOMING.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{SLAVERY_AND_OVERCOMING.intro}</p>
            <div className="space-y-4">
              {SLAVERY_AND_OVERCOMING.sections.map((sec, i) => (
                <div key={i}>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{sec.heading}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{sec.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Museums */}
          <SectionCard delay={450}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">museum</span>
              Museums
            </h2>
            <div className="space-y-6">
              {MUSEUMS.map((m) => (
                <div key={m.name} className="space-y-2">
                  {m.image && <ImageBlock src={m.image} alt={m.name} className="mb-2" />}
                  <p className="font-black text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{m.location}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{m.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Persons like Ms Lou */}
          <SectionCard delay={500}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
              Icons: Miss Lou & More
            </h2>
            <div className="space-y-4">
              {PERSONS_LIKE_MS_LOU.map((p) => (
                <div key={p.name} className="flex gap-4 items-start">
                  {p.image && (
                    <div className="shrink-0 size-16 rounded-2xl overflow-hidden border border-white/10">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{p.role}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{p.blurb}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Cuisine */}
          <SectionCard delay={550}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">restaurant</span>
              Jamaican Cuisine
            </h2>
            <div className="space-y-3">
              {JAMAICAN_CUISINE.map((food) => (
                <div key={food.name} className="py-2 border-b border-white/5 last:border-0">
                  <p className="font-bold text-slate-900 dark:text-white">{food.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{food.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* National symbols */}
          <SectionCard delay={600}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
              National Dish, Symbols & More
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NATIONAL_SYMBOLS.map((s) => (
                <div key={s.name} className="rounded-xl border border-white/10 overflow-hidden bg-white/5 dark:bg-black/20">
                  {s.image && (
                    <img src={s.image} alt={s.value} className="w-full h-28 object-cover" loading="lazy" />
                  )}
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{s.name}</p>
                    <p className="font-bold text-slate-900 dark:text-white">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="text-center py-8">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">One Love 🇯🇲</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JamaicanHistoryView;
