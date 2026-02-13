import React, { useRef } from 'react';
import {
  NATIONAL_HEROES,
  ICONIC_PLACES,
  JAMAICAN_CURRENCY,
  BRITISH_RULE,
  TAINOS,
  COLUMBUS_IN_JAMAICA,
  SLAVERY_AND_OVERCOMING,
  MUSEUMS,
  PERSONS_LIKE_MS_LOU,
  JAMAICAN_CUISINE,
  NATIONAL_SYMBOLS,
  PRIME_MINISTERS,
  SPORTS_ICONS,
  REGGAE_BOYS_GIRLS,
  OLYMPIC_MEDALS,
} from '../data/jamaicanHistory';
import type { ExternalLink } from '../data/jamaicanHistory';

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

const LinkList: React.FC<{ links: ExternalLink[]; className?: string }> = ({ links, className = '' }) => (
  <div className={`flex flex-wrap gap-2 ${className}`}>
    {links.map((link) => (
      <a
        key={link.url}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl glass text-xs font-bold text-primary border border-primary/20 hover:bg-primary/10 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">open_in_new</span>
        {link.label}
      </a>
    ))}
  </div>
);

const JamaicanHistoryView: React.FC<JamaicanHistoryViewProps> = ({ onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed inset-0 z-overlay bg-white dark:bg-background-dark flex flex-col font-display overflow-hidden animate-fade-in" role="article" aria-label="Jamaican History">
      <header className="sticky top-0 z-sticky flex items-center gap-3 px-4 py-4 pt-safe glass backdrop-blur-md border-b border-white/5">
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
              From the Taínos to Independence — heroes, places, culture, sport, and how we overcame.
            </p>
          </div>

          {/* National Heroes */}
          <SectionCard delay={100}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">military_tech</span>
              National Heroes
            </h2>
            <div className="space-y-4">
              {NATIONAL_HEROES.map((hero) => (
                <div key={hero.name} className="pl-4 border-l-2 border-primary/30 py-1">
                  <p className="font-black text-slate-900 dark:text-white">{hero.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{hero.role} · {hero.year}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{hero.blurb}</p>
                  <LinkList links={hero.links} className="mt-2" />
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
                <div key={place.name} className="space-y-2">
                  <p className="font-black text-slate-900 dark:text-white">{place.name}</p>
                  <p className="text-[10px] font-bold text-jamaican-gold/80 uppercase tracking-wider">{place.established}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{place.description}</p>
                  <LinkList links={place.links} />
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
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{JAMAICAN_CURRENCY.intro}</p>
            <div className="space-y-3 mb-4">
              {JAMAICAN_CURRENCY.sections.map((sec, i) => (
                <div key={i}>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{sec.heading}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{sec.text}</p>
                </div>
              ))}
            </div>
            <LinkList links={JAMAICAN_CURRENCY.links} />
          </SectionCard>

          {/* Prime Ministers */}
          <SectionCard delay={220}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">account_balance</span>
              Jamaica&apos;s Prime Ministers
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Since independence on 6 August 1962, Jamaica has been led by these Prime Ministers. JLP = Jamaica Labour Party, PNP = People&apos;s National Party.
            </p>
            <div className="space-y-3">
              {PRIME_MINISTERS.map((pm) => (
                <div key={`${pm.name}-${pm.term}`} className="py-2 border-b border-white/5 last:border-0">
                  <p className="font-black text-slate-900 dark:text-white">{pm.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{pm.party} · {pm.term}</p>
                  <LinkList links={pm.links} className="mt-1" />
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
            <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-300 mb-4">
              {BRITISH_RULE.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            <LinkList links={BRITISH_RULE.links} />
          </SectionCard>

          {/* Tainos */}
          <SectionCard delay={300}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">history_edu</span>
              {TAINOS.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{TAINOS.intro}</p>
            <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-300 mb-4">
              {TAINOS.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            <LinkList links={TAINOS.links} />
          </SectionCard>

          {/* Columbus */}
          <SectionCard delay={350}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">sailing</span>
              {COLUMBUS_IN_JAMAICA.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{COLUMBUS_IN_JAMAICA.intro}</p>
            <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-300 mb-4">
              {COLUMBUS_IN_JAMAICA.impact.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <LinkList links={COLUMBUS_IN_JAMAICA.links} />
          </SectionCard>

          {/* Slavery & Overcoming */}
          <SectionCard delay={400}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">favorite</span>
              {SLAVERY_AND_OVERCOMING.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{SLAVERY_AND_OVERCOMING.intro}</p>
            <div className="space-y-4 mb-4">
              {SLAVERY_AND_OVERCOMING.sections.map((sec, i) => (
                <div key={i}>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{sec.heading}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{sec.text}</p>
                </div>
              ))}
            </div>
            <LinkList links={SLAVERY_AND_OVERCOMING.links} />
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
                  <p className="font-black text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{m.location}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{m.description}</p>
                  <LinkList links={m.links} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Icons: Miss Lou & More */}
          <SectionCard delay={500}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
              Icons: Miss Lou & More
            </h2>
            <div className="space-y-4">
              {PERSONS_LIKE_MS_LOU.map((p) => (
                <div key={p.name}>
                  <p className="font-black text-slate-900 dark:text-white">{p.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{p.role}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{p.blurb}</p>
                  <LinkList links={p.links} className="mt-2" />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Sports Icons */}
          <SectionCard delay={520}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">sports</span>
              Iconic Sports People
            </h2>
            <div className="space-y-4">
              {SPORTS_ICONS.map((s) => (
                <div key={s.name}>
                  <p className="font-black text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-[10px] font-bold text-jamaican-gold/80 uppercase tracking-wider">{s.sport}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{s.blurb}</p>
                  <LinkList links={s.links} className="mt-2" />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Reggae Boyz & Reggae Girlz */}
          <SectionCard delay={540}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">sports_soccer</span>
              Reggae Boyz & Reggae Girlz
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-black text-slate-900 dark:text-white">Reggae Boyz (Men&apos;s national team)</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{REGGAE_BOYS_GIRLS.reggaeBoyz.intro}</p>
                <LinkList links={REGGAE_BOYS_GIRLS.reggaeBoyz.links} className="mt-2" />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white">Reggae Girlz (Women&apos;s national team)</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{REGGAE_BOYS_GIRLS.reggaeGirlz.intro}</p>
                <LinkList links={REGGAE_BOYS_GIRLS.reggaeGirlz.links} className="mt-2" />
              </div>
            </div>
          </SectionCard>

          {/* Olympic Medals */}
          <SectionCard delay={560}>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-jamaican-gold text-2xl">emoji_events</span>
              Jamaica at the Olympics
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{OLYMPIC_MEDALS.intro}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{OLYMPIC_MEDALS.summary}</p>
            <ul className="space-y-1 list-disc list-inside text-sm text-slate-600 dark:text-slate-300 mb-4">
              {OLYMPIC_MEDALS.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
            <LinkList links={OLYMPIC_MEDALS.links} />
          </SectionCard>

          {/* Cuisine */}
          <SectionCard delay={580}>
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
            <div className="space-y-4">
              {NATIONAL_SYMBOLS.map((s) => (
                <div key={s.name} className="py-2 border-b border-white/5 last:border-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{s.name}</p>
                  <p className="font-bold text-slate-900 dark:text-white">{s.value}</p>
                  {s.description && <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{s.description}</p>}
                  <LinkList links={s.links} className="mt-1" />
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
