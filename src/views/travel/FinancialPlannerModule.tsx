import React, { useMemo, useState } from 'react';
import TravelMarkdown from '../../components/travel/TravelMarkdown';
import { aviationRoutes } from '../../data/aviationRoutes';
import { travelPlaces } from '../../data/travelPlaces';
import { streamTravelText } from '../../services/geminiService';
import AILoadingSkeleton from '../../components/travel/AILoadingSkeleton';
import { generateTripPDF } from '../../utils/travel/generateTripPDF';
import { useAIProgress } from '../../hooks/useAIProgress';

type Currency = 'USD' | 'JMD';
type Accommodation = 'Hotel' | 'Villa' | 'Airbnb' | 'Hostel' | 'Any';

interface PlannerForm {
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  travellers: number;
  budget: string;
  currency: Currency;
  interests: string[];
  accommodation: Accommodation;
}

interface SavedPlan {
  id: string;
  destination: string;
  createdAt: string;
  budget: number;
  currency: Currency;
  response: string;
}

interface SavingsGoal {
  targetAmount: number;
  currentSavings: number;
  targetDate: string;
}

const PLAN_KEY = 'likkle_travel_plans';
const GOAL_KEY = 'likkle_travel_savings_goals';

const interests = ['Beach', 'Food & Dining', 'Culture', 'Adventure', 'Shopping', 'Nightlife', 'Family-Friendly', 'Luxury', 'Budget Travel'];
const accommodations: Accommodation[] = ['Hotel', 'Villa', 'Airbnb', 'Hostel', 'Any'];

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const getNights = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
};

const parseAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0;

const findMatchingRoute = (destination: string) => {
  const normalized = destination.toLowerCase();
  return aviationRoutes.find(route =>
    normalized.includes(route.destination.city.toLowerCase()) ||
    normalized.includes(route.destination.country.toLowerCase()) ||
    normalized.includes(route.destination.code.toLowerCase())
  );
};

const FinancialPlannerModule: React.FC = () => {
  const [form, setForm] = useState<PlannerForm>({
    destination: 'Miami, USA',
    departureCity: 'Kingston, Jamaica',
    startDate: '',
    endDate: '',
    travellers: 1,
    budget: '1500',
    currency: 'USD',
    interests: ['Beach', 'Food & Dining'],
    accommodation: 'Hotel'
  });
  const [result, setResult] = useState(() => sessionStorage.getItem('lw_financial_result') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => readJson<SavedPlan[]>(PLAN_KEY, []));
  const [goal, setGoal] = useState<SavingsGoal>(() => readJson<SavingsGoal>(GOAL_KEY, { targetAmount: 1500, currentSavings: 250, targetDate: '' }));
  const [essentialsOpen, setEssentialsOpen] = useState(false);
  const [openDay, setOpenDay] = useState(1);
  const destinationTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const departureTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const nights = getNights(form.startDate, form.endDate);
  const budget = parseAmount(form.budget);
  const matchingRoute = findMatchingRoute(form.destination);
  const estimatedTotal = useMemo(() => {
    const flight = matchingRoute ? parseAmount(matchingRoute.estimatedCost || '400') * form.travellers : 450 * form.travellers;
    const accommodation = (form.accommodation === 'Hostel' ? 55 : form.accommodation === 'Villa' ? 280 : form.accommodation === 'Airbnb' ? 120 : 180) * Math.max(nights, 1);
    const food = 55 * Math.max(nights, 1) * form.travellers;
    const activities = 45 * Math.max(nights, 1) * form.travellers;
    const essentials = 160 * form.travellers;
    return Math.round(flight + accommodation + food + activities + essentials);
  }, [form.accommodation, form.travellers, matchingRoute, nights]);
  const progressPercent = budget ? Math.min(100, Math.round((estimatedTotal / budget) * 100)) : 0;
  const progressColor = estimatedTotal <= budget * 0.85 ? 'bg-primary' : estimatedTotal <= budget ? 'bg-jamaican-gold' : 'bg-red-500';
  const aiProgress = useAIProgress(isLoading, !!result && !isLoading);

  React.useEffect(() => {
    [destinationTextareaRef.current, departureTextareaRef.current].forEach(el => {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [form.destination, form.departureCity]);

  const resizePlannerTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const updateForm = <K extends keyof PlannerForm>(key: K, value: PlannerForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(item => item !== interest)
        : [...prev.interests, interest]
    }));
  };

  const generatePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setResult('');
    const relevantPlaces = travelPlaces
      .filter(place => form.interests.some(interest => {
        const lower = interest.toLowerCase();
        return place.description.toLowerCase().includes(lower) || place.category.includes(lower.slice(0, 5));
      }))
      .slice(0, 6)
      .map(place => `${place.name} (${place.averageCost || 'cost unknown'})`)
      .join(', ');
    const fallback = [
      `Trip plan for ${form.destination}`,
      '',
      `Estimated total: ${form.currency} ${estimatedTotal.toLocaleString()}`,
      `Flight estimate: ${matchingRoute?.estimatedCost || 'From $450 USD'} from ${form.departureCity}.`,
      `Accommodation: plan for ${Math.max(nights, 1)} night(s) in a ${form.accommodation.toLowerCase()} style stay.`,
      'Meals: keep a daily food range and mix local spots with one nicer dinner.',
      `Activities: compare places such as ${relevantPlaces || 'Devon House, Bob Marley Museum, Dunns River Falls, and Seven Mile Beach'}.`,
      'Essentials: budget for swimwear, sunscreen, beach shoes, travel adapter, small first-aid items, and cosmetics.',
      estimatedTotal <= budget ? 'Budget check: this looks workable with a small buffer.' : `Budget check: you may need about ${form.currency} ${(estimatedTotal - budget).toLocaleString()} more.`,
      'Savings tip: book mid-week flights, keep one low-spend day, and reserve transport money before shopping.'
    ].join('\n');
    const response = await streamTravelText(
      `Build a structured travel budget and trip plan.
Destination: ${form.destination}
Departure city: ${form.departureCity}
Dates: ${form.startDate || 'not set'} to ${form.endDate || 'not set'} (${nights || 'unknown'} nights)
Travellers: ${form.travellers}
Budget: ${form.currency} ${budget}
Interests: ${form.interests.join(', ')}
Accommodation: ${form.accommodation}
Matching route estimate: ${matchingRoute ? `${matchingRoute.origin.code} to ${matchingRoute.destination.code}, ${matchingRoute.estimatedCost}, ${matchingRoute.durationHours} hours` : 'No static route matched'}
Jamaica attraction data to cross-reference where useful: ${relevantPlaces}

Return a day-by-day itinerary, flight/accommodation/meals/activity/shopping essentials cost estimates, total breakdown, budget sufficiency, saving tips, and a short cosmetics/travel essentials estimator.`,
      fallback,
      (partial) => setResult(partial)
    );
    setResult(response);
    sessionStorage.setItem('lw_financial_result', response);
    setIsLoading(false);
  };

  const savePlan = () => {
    if (!result) return;
    setSavedPlans(prev => {
      const next = [{
        id: Date.now().toString(),
        destination: form.destination,
        createdAt: new Date().toISOString(),
        budget,
        currency: form.currency,
        response: result
      }, ...prev];
      localStorage.setItem(PLAN_KEY, JSON.stringify(next));
      return next;
    });
  };

  const saveGoal = (nextGoal: SavingsGoal) => {
    setGoal(nextGoal);
    localStorage.setItem(GOAL_KEY, JSON.stringify(nextGoal));
  };

  const goalRemaining = Math.max(0, goal.targetAmount - goal.currentSavings);
  const goalProgress = goal.targetAmount ? Math.min(100, Math.round((goal.currentSavings / goal.targetAmount) * 100)) : 0;
  const weeksRemaining = goal.targetDate ? Math.max(1, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (86400000 * 7))) : 0;
  const weeklyNeeded = weeksRemaining ? Math.ceil(goalRemaining / weeksRemaining) : goalRemaining;

  const handleDownloadPDF = () => {
    if (!result) return;
    generateTripPDF({
      destination: form.destination,
      departureCity: form.departureCity,
      startDate: form.startDate,
      endDate: form.endDate,
      travellers: form.travellers,
      budget,
      currency: form.currency,
      accommodation: form.accommodation,
      interests: form.interests,
      estimatedTotal,
      flightEstimate: matchingRoute?.estimatedCost || 'From $450 USD',
      nights,
      aiPlanText: result,
      goalTargetAmount: goal.targetAmount,
      goalCurrentSavings: goal.currentSavings,
      goalProgress,
      weeklyNeeded
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <form onSubmit={generatePlan} className="glass rounded-2xl p-4 shadow-2xl">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">AI Trip Plan</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Build your travel budget</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Destination</span>
            <textarea
              ref={destinationTextareaRef}
              value={form.destination}
              onChange={event => {
                updateForm('destination', event.target.value);
                resizePlannerTextarea(event.currentTarget);
              }}
              rows={1}
              className="min-h-[48px] w-full resize-none overflow-hidden rounded-2xl border border-slate-950/10 bg-white/70 px-4 py-3 text-sm font-bold leading-relaxed text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Departure City</span>
            <textarea
              ref={departureTextareaRef}
              value={form.departureCity}
              onChange={event => {
                updateForm('departureCity', event.target.value);
                resizePlannerTextarea(event.currentTarget);
              }}
              rows={1}
              className="min-h-[48px] w-full resize-none overflow-hidden rounded-2xl border border-slate-950/10 bg-white/70 px-4 py-3 text-sm font-bold leading-relaxed text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Start Date</span>
            <input type="date" value={form.startDate} onChange={event => updateForm('startDate', event.target.value)} className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">End Date</span>
            <input type="date" value={form.endDate} onChange={event => updateForm('endDate', event.target.value)} className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Travellers</span>
            <div className="flex h-12 items-center justify-between rounded-2xl border border-slate-950/10 bg-white/70 px-3 dark:border-white/10 dark:bg-white/5">
              <button type="button" onClick={() => updateForm('travellers', Math.max(1, form.travellers - 1))} className="material-symbols-outlined text-primary" aria-label="Decrease travellers">remove</button>
              <span className="text-lg font-black text-slate-950 dark:text-white">{form.travellers}</span>
              <button type="button" onClick={() => updateForm('travellers', Math.min(10, form.travellers + 1))} className="material-symbols-outlined text-primary" aria-label="Increase travellers">add</button>
            </div>
          </div>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Total Budget</span>
            <input inputMode="decimal" value={form.budget} onChange={event => updateForm('budget', event.target.value)} className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Currency</span>
            <div className="flex h-12 rounded-2xl bg-slate-950/5 p-1 dark:bg-white/5">
              {(['USD', 'JMD'] as Currency[]).map(currency => (
                <button key={currency} type="button" onClick={() => updateForm('currency', currency)} className={`flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest ${form.currency === currency ? 'bg-primary text-background-dark' : 'text-slate-600 dark:text-white/50'}`}>{currency}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Travel Interests</span>
          <div className="flex flex-wrap gap-2">
            {interests.map(interest => (
              <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${form.interests.includes(interest) ? 'border-primary bg-primary text-background-dark' : 'border-slate-950/10 text-slate-600 dark:border-white/10 dark:text-white/60'}`}>{interest}</button>
            ))}
          </div>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Accommodation Preference</span>
          <select value={form.accommodation} onChange={event => updateForm('accommodation', event.target.value as Accommodation)} className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white">
            {accommodations.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>

        <button type="submit" disabled={isLoading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[11px] font-black uppercase tracking-widest text-background-dark disabled:opacity-60">
          <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true">
            {isLoading ? 'progress_activity' : 'auto_awesome'}
          </span>
          {isLoading ? 'Generating…' : 'Generate Trip Plan'}
        </button>
      </form>

      {(result || isLoading) && (
        <section className="glass rounded-2xl p-4 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Plan Result</p>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">{form.destination}</h2>
            </div>
            {!isLoading && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={savePlan} disabled={!result} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-background-dark disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">bookmark_add</span>
                  Save Plan
                </button>
                <button type="button" onClick={handleDownloadPDF} disabled={!result} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary px-4 text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
                  Download PDF
                </button>
              </div>
            )}
          </div>

          {isLoading && !result ? (
            <div className="mt-4 rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
              <AILoadingSkeleton progress={aiProgress} />
            </div>
          ) : result ? (
            <>
              <div className="mt-4 rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
                <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                  <span>Total vs Budget</span>
                  <span>{form.currency} {estimatedTotal.toLocaleString()} / {form.currency} {budget.toLocaleString()}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-950/10 dark:bg-white/10">
                  <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {!isLoading && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['flight', 'Flight', matchingRoute?.estimatedCost || 'From $450 USD'],
                    ['hotel', 'Stay', `${Math.max(nights, 1)} night(s)`],
                    ['restaurant', 'Meals', `$${55 * Math.max(nights, 1) * form.travellers} est.`],
                    ['shopping_bag', 'Essentials', `$${160 * form.travellers} est.`]
                  ].map(([icon, label, value]) => (
                    <div key={label} className="rounded-2xl bg-slate-950/5 p-3 dark:bg-white/5">
                      <span className="material-symbols-outlined text-primary" aria-hidden="true">{icon}</span>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{label}</p>
                      <p className="text-sm font-black text-slate-950 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && (
                <div className="mt-4 space-y-2">
                  {[1, 2, 3].map(day => (
                    <div key={day} className="rounded-2xl border border-slate-950/10 dark:border-white/10">
                      <button type="button" onClick={() => setOpenDay(openDay === day ? 0 : day)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-black text-slate-950 dark:text-white">
                        Day {day} Focus
                        <span className="material-symbols-outlined text-primary" aria-hidden="true">{openDay === day ? 'expand_less' : 'expand_more'}</span>
                      </button>
                      {openDay === day && (
                        <p className="px-4 pb-4 text-sm font-semibold leading-relaxed text-slate-600 dark:text-white/60">
                          {day === 1 ? 'Arrive, settle in, and keep the first night low-pressure.' : day === 2 ? 'Use the strongest full day for the main attraction, food stop, and evening walk.' : 'Leave room for shopping, cosmetics, beach gear, and the return airport transfer.'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">auto_awesome</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">AI-Generated Plan</p>
                  <div className="h-px flex-1 bg-primary/20" />
                </div>
                <div className="travel-md rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-inner dark:from-primary/8">
                  <TravelMarkdown>{result}</TravelMarkdown>
                  {isLoading && <span className="inline-block size-2 bg-primary rounded-full animate-pulse ml-1 align-middle" />}
                </div>
              </div>
            </>
          ) : null}
        </section>
      )}

      <section className="glass rounded-2xl p-4 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Savings Goal</p>
        <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Set a target</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Target Amount</span>
            <input inputMode="decimal" value={goal.targetAmount} onChange={event => saveGoal({ ...goal, targetAmount: parseAmount(event.target.value) })} className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Current Savings</span>
            <input inputMode="decimal" value={goal.currentSavings} onChange={event => saveGoal({ ...goal, currentSavings: parseAmount(event.target.value) })} className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Target Date</span>
            <input type="date" value={goal.targetDate} onChange={event => saveGoal({ ...goal, targetDate: event.target.value })} className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
          <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
            <span>{goalProgress}% saved</span>
            <span>{weeklyNeeded.toLocaleString()} per week needed</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-950/10 dark:bg-white/10">
            <div className="h-full rounded-full bg-primary" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </section>

      <section className="glass rounded-2xl p-4 shadow-2xl">
        <button type="button" onClick={() => setEssentialsOpen(prev => !prev)} className="flex w-full items-center justify-between text-left">
          <span>
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Essentials Estimator</span>
            <span className="mt-1 block text-xl font-black text-slate-950 dark:text-white">What will I need to buy?</span>
          </span>
          <span className="material-symbols-outlined text-primary" aria-hidden="true">{essentialsOpen ? 'expand_less' : 'expand_more'}</span>
        </button>
        {essentialsOpen && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Swimwear', '$45-120'],
              ['Reef-safe sunscreen', '$12-25'],
              ['Beach shoes or sandals', '$25-70'],
              ['Travel adapter and power bank', '$30-80'],
              ['Snorkelling gear', '$35-100'],
              ['Mini cosmetics kit', '$25-75'],
              ['Waterproof phone pouch', '$10-25'],
              ['Light first-aid kit', '$12-30']
            ].map(([item, cost]) => (
              <div key={item} className="rounded-2xl bg-slate-950/5 p-3 dark:bg-white/5">
                <p className="text-sm font-black text-slate-950 dark:text-white">{item}</p>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-white/40">{cost} estimate</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {savedPlans.length > 0 && (
        <section className="glass rounded-2xl p-4 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Saved Plans</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {savedPlans.slice(0, 4).map(plan => (
              <div key={plan.id} className="rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
                <h3 className="font-black text-slate-950 dark:text-white">{plan.destination}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-white/40">{new Date(plan.createdAt).toLocaleDateString()} - {plan.currency} {plan.budget.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FinancialPlannerModule;
