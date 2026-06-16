export interface DangerZone {
  id: string;
  name: string;
  parish: string;
  description: string;
  severity: 'high' | 'moderate' | 'caution';
  polygon: [number, number][];
  timeWarning?: string;
  tips: string[];
}

export const DANGER_ZONES: DangerZone[] = [
  // ===== KINGSTON =====
  {
    id: 'dz-1',
    name: 'Tivoli Gardens',
    parish: 'Kingston',
    description: 'Historically volatile area with gang activity. Not a tourist area.',
    severity: 'high',
    polygon: [[17.9740, -76.8010], [17.9740, -76.7940], [17.9700, -76.7940], [17.9700, -76.8010]],
    tips: ['Do not enter this area', 'Use alternate routes through Kingston', 'Taxi drivers know to avoid this zone']
  },
  {
    id: 'dz-2',
    name: 'Trench Town',
    parish: 'Kingston',
    description: 'Cultural significance (Bob Marley heritage) but safety concerns persist. Visit only with organized tours during daytime.',
    severity: 'moderate',
    polygon: [[17.9780, -76.8050], [17.9780, -76.7970], [17.9740, -76.7970], [17.9740, -76.8050]],
    timeWarning: 'Daytime organized tours only',
    tips: ['Only visit with a registered tour guide', 'Do not go after dark', 'Keep valuables hidden', 'Stay with your group']
  },
  {
    id: 'dz-3',
    name: 'Mountain View / August Town',
    parish: 'St. Andrew',
    description: 'Residential areas with periodic security concerns.',
    severity: 'caution',
    polygon: [[18.0100, -76.7500], [18.0100, -76.7400], [18.0020, -76.7400], [18.0020, -76.7500]],
    timeWarning: 'Avoid after dark',
    tips: ['Stick to main roads', 'Use registered taxis', 'Avoid walking alone at night']
  },

  // ===== MONTEGO BAY =====
  {
    id: 'dz-4',
    name: 'Canterbury / Norwood',
    parish: 'St. James',
    description: 'Areas outside the tourist corridor with elevated crime rates.',
    severity: 'high',
    polygon: [[18.4800, -77.9350], [18.4800, -77.9250], [18.4730, -77.9250], [18.4730, -77.9350]],
    tips: ['Stay within the Hip Strip and tourist corridor', 'Do not venture into interior communities', 'Use hotel-arranged transportation']
  },
  {
    id: 'dz-5',
    name: 'Flankers',
    parish: 'St. James',
    description: 'Community area outside the tourist zone with periodic violence.',
    severity: 'high',
    polygon: [[18.4850, -77.9400], [18.4850, -77.9320], [18.4790, -77.9320], [18.4790, -77.9400]],
    tips: ['Not a tourist destination', 'Stay on main highways if passing through', 'Keep windows up and doors locked']
  },

  // ===== SPANISH TOWN =====
  {
    id: 'dz-6',
    name: 'Spanish Town Central',
    parish: 'St. Catherine',
    description: 'Historic town with safety concerns in certain neighbourhoods.',
    severity: 'moderate',
    polygon: [[18.0150, -76.9620], [18.0150, -76.9480], [18.0050, -76.9480], [18.0050, -76.9620]],
    timeWarning: 'Daytime visits only for historical sites',
    tips: ['Visit historical sites during daytime hours', 'Use registered taxis', 'Stay in commercial/tourist areas', 'Leave before dark']
  },
];

export const SEVERITY_META = {
  high:     { label: 'Avoid',        color: '#ef4444', fillOpacity: 0.25, borderColor: '#dc2626', icon: 'dangerous' },
  moderate: { label: 'High Caution', color: '#f97316', fillOpacity: 0.18, borderColor: '#ea580c', icon: 'warning' },
  caution:  { label: 'Stay Alert',   color: '#eab308', fillOpacity: 0.12, borderColor: '#ca8a04', icon: 'info' },
};

export const GENERAL_TIME_WARNINGS = [
  { time: 'After Dark (6pm+)', advice: 'Avoid unfamiliar areas after sunset. Use reputable taxis or hotel transportation.', icon: 'dark_mode' },
  { time: 'Late Night (10pm+)', advice: 'Stay in well-lit, populated tourist areas. Travel in groups. Pre-book transportation.', icon: 'bedtime' },
  { time: 'Early Morning (before 6am)', advice: 'Avoid walking alone. Use pre-booked transportation for airport transfers.', icon: 'wb_twilight' },
];

export const GENERAL_SAFETY_TIPS = [
  'Use JUTA (Jamaica Union of Travellers Association) licensed taxis — look for the red licence plates',
  'Keep valuables in your hotel safe, not on your person',
  'Don\'t flash expensive jewellery, watches, or electronics in public',
  'Keep a photocopy of your passport separate from the original',
  'Avoid walking alone on beaches at night',
  'Stay on main roads and avoid shortcuts through unfamiliar communities',
  'Be cautious with unofficial tour guides — use hotel-recommended services',
  'Don\'t leave drinks unattended at bars or clubs',
  'Be wary of overly friendly strangers offering unsolicited help or "deals"',
  'Keep car doors locked and windows up when driving through unfamiliar areas',
  'Download offline maps before exploring — mobile signal can be weak in rural areas',
  'Register with your embassy or consulate before travelling',
  'Carry only the cash you need for the day, leave the rest secured',
  'Use ATMs inside banks or hotels, not standalone street ATMs',
];
