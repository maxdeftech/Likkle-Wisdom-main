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

const box = (lat: number, lng: number, latRadius = 0.004, lngRadius = 0.004): [number, number][] => [
  [lat + latRadius, lng - lngRadius],
  [lat + latRadius, lng + lngRadius],
  [lat - latRadius, lng + lngRadius],
  [lat - latRadius, lng - lngRadius],
];

const standardHighTips = [
  'Avoid casual exploration, especially without trusted local guidance',
  'Use hotel-arranged or licensed transportation',
  'Do not walk through unfamiliar residential communities after dark',
];

const standardCautionTips = [
  'Use normal urban awareness and stay on main roads',
  'Avoid isolated areas after dark',
  'Keep valuables out of sight and use licensed transportation',
];

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
  {
    id: 'dz-7',
    name: 'Denham Town',
    parish: 'Kingston',
    description: 'West Kingston community commonly flagged for extra caution by tourist safety guidance.',
    severity: 'high',
    polygon: box(17.9785, -76.7990),
    timeWarning: 'Highest caution after dark, 6 PM - 6 AM',
    tips: standardHighTips,
  },
  {
    id: 'dz-8',
    name: 'Matthews Lane',
    parish: 'Kingston',
    description: 'Downtown Kingston area where unfamiliar visitors should avoid casual exploration.',
    severity: 'high',
    polygon: box(17.9759, -76.7930, 0.0035, 0.0035),
    timeWarning: 'Highest caution after dark, 6 PM - 6 AM',
    tips: standardHighTips,
  },
  {
    id: 'dz-9',
    name: 'Parade Gardens',
    parish: 'Kingston',
    description: 'Inner-city Kingston community commonly included in extra-caution tourist advisories.',
    severity: 'high',
    polygon: box(17.9734, -76.7869, 0.0035, 0.0035),
    timeWarning: 'Highest caution after dark, 6 PM - 6 AM',
    tips: standardHighTips,
  },
  {
    id: 'dz-10',
    name: 'Dunkirk',
    parish: 'Kingston',
    description: 'East Kingston residential area where visitors should use extra caution and local guidance.',
    severity: 'high',
    polygon: box(17.9700, -76.7610, 0.0045, 0.0045),
    timeWarning: 'Highest caution after dark, 6 PM - 6 AM',
    tips: standardHighTips,
  },
  {
    id: 'dz-11',
    name: 'Grants Pen',
    parish: 'St. Andrew',
    description: 'Certain sections are periodically flagged for extra caution due to local security concerns.',
    severity: 'moderate',
    polygon: box(18.0430, -76.7980, 0.005, 0.005),
    timeWarning: 'Avoid unfamiliar sections after dark',
    tips: standardHighTips,
  },
  {
    id: 'dz-12',
    name: 'Riverton City',
    parish: 'St. Andrew',
    description: 'Community near the Riverton disposal area where tourists should avoid unnecessary entry.',
    severity: 'high',
    polygon: box(18.0150, -76.8420, 0.006, 0.006),
    timeWarning: 'Highest caution after dark, 6 PM - 6 AM',
    tips: standardHighTips,
  },
  {
    id: 'dz-13',
    name: 'Seaview Gardens',
    parish: 'St. Andrew',
    description: 'West St. Andrew community commonly flagged for extra caution by visitor safety guidance.',
    severity: 'high',
    polygon: box(17.9980, -76.8450, 0.005, 0.005),
    timeWarning: 'Highest caution after dark, 6 PM - 6 AM',
    tips: standardHighTips,
  },
  {
    id: 'dz-14',
    name: 'Waterhouse',
    parish: 'St. Andrew',
    description: 'Residential community where tourists should avoid casual entry without trusted local guidance.',
    severity: 'high',
    polygon: box(18.0000, -76.8310, 0.005, 0.005),
    timeWarning: 'Highest caution after dark, 6 PM - 6 AM',
    tips: standardHighTips,
  },

  // ===== MONTEGO BAY =====
  {
    id: 'dz-4',
    name: 'Canterbury',
    parish: 'St. James',
    description: 'Montego Bay community west of the city centre and outside the main tourist corridor.',
    severity: 'high',
    polygon: box(18.4798, -77.9170, 0.005, 0.005),
    timeWarning: 'Highest caution at night outside organized tours or local guidance',
    tips: ['Stay within the Hip Strip and tourist corridor', 'Do not venture into interior communities', 'Use hotel-arranged transportation']
  },
  {
    id: 'dz-26',
    name: 'Norwood',
    parish: 'St. James',
    description: 'Montego Bay community east of Canterbury and inland from the resort corridor.',
    severity: 'high',
    polygon: box(18.4922, -77.8863, 0.006, 0.007),
    timeWarning: 'Highest caution at night outside organized tours or local guidance',
    tips: ['Stay within the Hip Strip and tourist corridor', 'Do not venture into interior communities', 'Use hotel-arranged transportation']
  },
  {
    id: 'dz-5',
    name: 'Flankers',
    parish: 'St. James',
    description: 'Community area outside the tourist zone with periodic violence.',
    severity: 'high',
    polygon: box(18.5025, -77.8973, 0.006, 0.007),
    timeWarning: 'Highest caution at night outside organized tours or local guidance',
    tips: ['Not a tourist destination', 'Stay on main highways if passing through', 'Keep windows up and doors locked']
  },
  {
    id: 'dz-15',
    name: 'Mount Salem',
    parish: 'St. James',
    description: 'Montego Bay community outside the resort zone, periodically mentioned in security advisories.',
    severity: 'high',
    polygon: box(18.4680, -77.9050, 0.005, 0.005),
    timeWarning: 'Highest caution at night outside organized tours or local guidance',
    tips: standardHighTips,
  },
  {
    id: 'dz-16',
    name: 'Rose Heights',
    parish: 'St. James',
    description: 'Inner Montego Bay community where visitors should avoid casual exploration.',
    severity: 'high',
    polygon: box(18.4890, -77.9030, 0.005, 0.005),
    timeWarning: 'Highest caution at night outside organized tours or local guidance',
    tips: standardHighTips,
  },
  {
    id: 'dz-17',
    name: 'Granville',
    parish: 'St. James',
    description: 'Montego Bay community commonly flagged for extra caution away from tourist corridors.',
    severity: 'high',
    polygon: box(18.4620, -77.9350, 0.005, 0.005),
    timeWarning: 'Highest caution at night outside organized tours or local guidance',
    tips: standardHighTips,
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
  {
    id: 'dz-18',
    name: 'Tawes Meadows',
    parish: 'St. Catherine',
    description: 'Certain sections of Spanish Town are commonly flagged for late-evening and overnight caution.',
    severity: 'high',
    polygon: box(18.0080, -76.9710, 0.005, 0.005),
    timeWarning: 'Highest caution late evening and overnight',
    tips: standardHighTips,
  },
  {
    id: 'dz-19',
    name: 'Ellerslie Pen',
    parish: 'St. Catherine',
    description: 'Spanish Town area where active local conditions can change quickly.',
    severity: 'high',
    polygon: box(18.0200, -76.9560, 0.005, 0.005),
    timeWarning: 'Highest caution late evening and overnight',
    tips: standardHighTips,
  },
  {
    id: 'dz-20',
    name: 'Shelter Rock',
    parish: 'St. Catherine',
    description: 'Community in the Spanish Town area where unfamiliar visitors should use extra caution.',
    severity: 'high',
    polygon: box(18.0280, -76.9470, 0.005, 0.005),
    timeWarning: 'Highest caution late evening and overnight',
    tips: standardHighTips,
  },
  {
    id: 'dz-21',
    name: 'Portmore Caution Areas',
    parish: 'St. Catherine',
    description: 'Portmore is heavily residential and commercial; certain communities periodically experience gang violence.',
    severity: 'moderate',
    polygon: box(17.9500, -76.8900, 0.012, 0.016),
    timeWarning: 'Use higher caution late evening and overnight',
    tips: standardCautionTips,
  },

  // ===== CENTRAL & WESTERN PARISHES =====
  {
    id: 'dz-22',
    name: 'May Pen / Effortville',
    parish: 'Clarendon',
    description: 'Certain communities around May Pen and Effortville require extra urban caution.',
    severity: 'moderate',
    polygon: box(17.9650, -77.2450, 0.010, 0.012),
    timeWarning: 'Avoid unfamiliar sections late at night',
    tips: standardCautionTips,
  },
  {
    id: 'dz-23',
    name: 'Rocky Point',
    parish: 'Clarendon',
    description: 'Fishing/coastal community with periodic incidents; visitors should avoid isolated late-night movement.',
    severity: 'caution',
    polygon: box(17.7610, -77.2510, 0.006, 0.006),
    timeWarning: 'Use caution after dark',
    tips: standardCautionTips,
  },
  {
    id: 'dz-24',
    name: 'Mandeville Urban Sections',
    parish: 'Manchester',
    description: 'Generally lower risk than major hotspots, but some town sections experience occasional criminal activity.',
    severity: 'caution',
    polygon: box(18.0410, -77.5070, 0.010, 0.010),
    timeWarning: 'Use normal urban caution after dark',
    tips: standardCautionTips,
  },
  {
    id: 'dz-25',
    name: 'Savanna-la-Mar / Russia District',
    parish: 'Westmoreland',
    description: 'Certain parts of Savanna-la-Mar and the Russia district are periodically mentioned in police operations.',
    severity: 'moderate',
    polygon: box(18.2190, -78.1340, 0.010, 0.010),
    timeWarning: 'Avoid unfamiliar residential sections late at night',
    tips: standardCautionTips,
  },
];

export const JAMAICA_TOURIST_SAFETY_KNOWLEDGE = `
Jamaica tourist safety context:
- This is not an official police map or real-time bulletin. Crime patterns change, and many people live, work, and travel safely in these communities every day.
- Areas commonly flagged for extra caution include Kingston and St. Andrew: Tivoli Gardens, Denham Town, Matthews Lane, Parade Gardens, Trench Town, Mountain View corridor, certain sections of August Town, Dunkirk, Grants Pen, Riverton City, Seaview Gardens, and Waterhouse. Highest caution is after dark, roughly 6 PM - 6 AM.
- St. Catherine: certain sections of Spanish Town, Tawes Meadows, Ellerslie Pen, Shelter Rock, central Spanish Town gang zones, and some Portmore communities. Highest caution is late evening and overnight.
- St. James / Montego Bay: Flanker, Norwood, Canterbury, Rose Heights, Mount Salem, and Granville. Highest caution is nighttime, especially outside organized tours or trusted local guidance.
- Clarendon: certain communities in May Pen, Effortville, and periodic incidents around Rocky Point.
- Manchester: Mandeville is generally lower risk than major hotspots, but some sections still need normal urban caution.
- Westmoreland: certain parts of Savanna-la-Mar and the Russia district are periodically mentioned in police operations. Hanover is generally safer than many urban centers, but normal precautions still apply.
- Tourist areas generally considered safer include Montego Bay Resort Zone / Hip Strip, Negril Seven Mile Beach area, Ocho Rios tourist district, Port Antonio tourist areas, Treasure Beach, Runaway Bay, and Falmouth cruise port area.
- Risk by time: 6 AM - 6 PM lowest; 6 PM - 10 PM moderate; 10 PM - 4 AM highest; bar closing times around 1 AM - 3 AM high.
- Main tourist risks: opportunistic theft, scams, wandering into unfamiliar residential communities, and driving in remote areas late at night.
- Safer habits: stay in normal tourism corridors, use licensed taxis, avoid isolated beaches at night, do not display large amounts of cash, and avoid drug or illegal-activity offers.
`;

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
