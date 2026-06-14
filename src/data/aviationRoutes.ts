export interface AirportPoint {
  code: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
}

export interface AviationRoute {
  id: string;
  origin: AirportPoint;
  destination: AirportPoint & { country: string; flag: string };
  airlines: string[];
  airlineWebsites: Record<string, string>;
  estimatedCost?: string;
  durationHours?: number;
  frequency?: string;
}

const airlineUrls: Record<string, string> = {
  'American Airlines': 'https://www.aa.com',
  'Caribbean Airlines': 'https://www.caribbean-airlines.com',
  'JetBlue': 'https://www.jetblue.com',
  'Air Canada': 'https://www.aircanada.com',
  'WestJet': 'https://www.westjet.com',
  'British Airways': 'https://www.britishairways.com',
  'Delta': 'https://www.delta.com',
  'Spirit': 'https://www.spirit.com',
  'Copa Airlines': 'https://www.copaair.com',
  'InterCaribbean': 'https://www.intercaribbean.com',
  'Bahamasair': 'https://www.bahamasair.com',
  'Frontier': 'https://www.flyfrontier.com',
  'Southwest': 'https://www.southwest.com',
  'United Airlines': 'https://www.united.com',
  'Virgin Atlantic': 'https://www.virginatlantic.com',
  'KLM': 'https://www.klm.com',
  'TUI fly': 'https://www.tui.com',
  'TUI': 'https://www.tui.com',
  'Condor': 'https://www.condor.com',
  'Eurowings Discover': 'https://www.eurowings.com',
  'Sunwing': 'https://www.sunwing.ca',
  'Charter/seasonal': 'https://www.visitjamaica.com'
};

const buildWebsites = (airlines: string[]): Record<string, string> =>
  Object.fromEntries(airlines.map(airline => [airline, airlineUrls[airline] ?? 'https://www.visitjamaica.com']));

export const KIN: AirportPoint = {
  code: 'KIN',
  name: 'Norman Manley International',
  lat: 17.9357,
  lng: -76.7875,
  city: 'Kingston'
};

export const MBJ: AirportPoint = {
  code: 'MBJ',
  name: 'Sangster International',
  lat: 18.5037,
  lng: -77.9134,
  city: 'Montego Bay'
};

const destinations = {
  mia: { code: 'MIA', name: 'Miami International', lat: 25.7959, lng: -80.2870, city: 'Miami', country: 'United States', flag: '🇺🇸' },
  jfk: { code: 'JFK', name: 'John F. Kennedy International', lat: 40.6413, lng: -73.7781, city: 'New York', country: 'United States', flag: '🇺🇸' },
  yyz: { code: 'YYZ', name: 'Toronto Pearson', lat: 43.6777, lng: -79.6248, city: 'Toronto', country: 'Canada', flag: '🇨🇦' },
  lhr: { code: 'LHR', name: 'Heathrow', lat: 51.4700, lng: -0.4543, city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  atl: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', lat: 33.6407, lng: -84.4277, city: 'Atlanta', country: 'United States', flag: '🇺🇸' },
  mco: { code: 'MCO', name: 'Orlando International', lat: 28.4312, lng: -81.3081, city: 'Orlando', country: 'United States', flag: '🇺🇸' },
  phl: { code: 'PHL', name: 'Philadelphia International', lat: 39.8744, lng: -75.2424, city: 'Philadelphia', country: 'United States', flag: '🇺🇸' },
  clt: { code: 'CLT', name: 'Charlotte Douglas', lat: 35.2144, lng: -80.9473, city: 'Charlotte', country: 'United States', flag: '🇺🇸' },
  fll: { code: 'FLL', name: 'Fort Lauderdale-Hollywood', lat: 26.0726, lng: -80.1527, city: 'Fort Lauderdale', country: 'United States', flag: '🇺🇸' },
  iad: { code: 'IAD', name: 'Washington Dulles', lat: 38.9531, lng: -77.4565, city: 'Washington DC', country: 'United States', flag: '🇺🇸' },
  iah: { code: 'IAH', name: 'George Bush Intercontinental', lat: 29.9902, lng: -95.3368, city: 'Houston', country: 'United States', flag: '🇺🇸' },
  dfw: { code: 'DFW', name: 'Dallas/Fort Worth', lat: 32.8998, lng: -97.0403, city: 'Dallas', country: 'United States', flag: '🇺🇸' },
  cun: { code: 'CUN', name: 'Cancun International', lat: 21.0365, lng: -86.8771, city: 'Cancun', country: 'Mexico', flag: '🇲🇽' },
  pty: { code: 'PTY', name: 'Tocumen International', lat: 9.0714, lng: -79.3835, city: 'Panama City', country: 'Panama', flag: '🇵🇦' },
  hav: { code: 'HAV', name: 'Jose Marti International', lat: 22.9892, lng: -82.4091, city: 'Havana', country: 'Cuba', flag: '🇨🇺' },
  nas: { code: 'NAS', name: 'Lynden Pindling International', lat: 25.0389, lng: -77.4662, city: 'Nassau', country: 'Bahamas', flag: '🇧🇸' },
  bgi: { code: 'BGI', name: 'Grantley Adams International', lat: 13.0746, lng: -59.4925, city: 'Bridgetown', country: 'Barbados', flag: '🇧🇧' },
  pos: { code: 'POS', name: 'Piarco International', lat: 10.5954, lng: -61.3372, city: 'Port of Spain', country: 'Trinidad and Tobago', flag: '🇹🇹' },
  ams: { code: 'AMS', name: 'Amsterdam Schiphol', lat: 52.3105, lng: 4.7683, city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
  fra: { code: 'FRA', name: 'Frankfurt Airport', lat: 50.0379, lng: 8.5622, city: 'Frankfurt', country: 'Germany', flag: '🇩🇪' }
};

export const aviationRoutes: AviationRoute[] = [
  { id: 'kin-mia', origin: KIN, destination: destinations.mia, airlines: ['American Airlines', 'Caribbean Airlines'], airlineWebsites: buildWebsites(['American Airlines', 'Caribbean Airlines']), estimatedCost: 'From $320 USD', durationHours: 1.9, frequency: 'Daily' },
  { id: 'kin-jfk', origin: KIN, destination: destinations.jfk, airlines: ['JetBlue', 'Caribbean Airlines'], airlineWebsites: buildWebsites(['JetBlue', 'Caribbean Airlines']), estimatedCost: 'From $380 USD', durationHours: 3.8, frequency: 'Daily' },
  { id: 'kin-yyz', origin: KIN, destination: destinations.yyz, airlines: ['Air Canada', 'WestJet'], airlineWebsites: buildWebsites(['Air Canada', 'WestJet']), estimatedCost: 'From $480 USD', durationHours: 4.3, frequency: 'Several weekly' },
  { id: 'kin-lhr', origin: KIN, destination: destinations.lhr, airlines: ['British Airways'], airlineWebsites: buildWebsites(['British Airways']), estimatedCost: 'From $780 USD', durationHours: 9.2, frequency: 'Several weekly' },
  { id: 'kin-atl', origin: KIN, destination: destinations.atl, airlines: ['Delta'], airlineWebsites: buildWebsites(['Delta']), estimatedCost: 'From $430 USD', durationHours: 3.1, frequency: 'Daily' },
  { id: 'kin-fll', origin: KIN, destination: destinations.fll, airlines: ['JetBlue', 'Spirit'], airlineWebsites: buildWebsites(['JetBlue', 'Spirit']), estimatedCost: 'From $280 USD', durationHours: 1.8, frequency: 'Daily' },
  { id: 'kin-pty', origin: KIN, destination: destinations.pty, airlines: ['Copa Airlines'], airlineWebsites: buildWebsites(['Copa Airlines']), estimatedCost: 'From $360 USD', durationHours: 2.1, frequency: 'Daily' },
  { id: 'kin-hav', origin: KIN, destination: destinations.hav, airlines: ['InterCaribbean', 'Caribbean Airlines'], airlineWebsites: buildWebsites(['InterCaribbean', 'Caribbean Airlines']), estimatedCost: 'From $300 USD', durationHours: 1.4, frequency: 'Several weekly' },
  { id: 'kin-nas', origin: KIN, destination: destinations.nas, airlines: ['Bahamasair', 'InterCaribbean'], airlineWebsites: buildWebsites(['Bahamasair', 'InterCaribbean']), estimatedCost: 'From $350 USD', durationHours: 1.6, frequency: 'Several weekly' },
  { id: 'kin-pos', origin: KIN, destination: destinations.pos, airlines: ['Caribbean Airlines'], airlineWebsites: buildWebsites(['Caribbean Airlines']), estimatedCost: 'From $410 USD', durationHours: 2.6, frequency: 'Several weekly' },
  { id: 'mbj-mia', origin: MBJ, destination: destinations.mia, airlines: ['American Airlines', 'Frontier'], airlineWebsites: buildWebsites(['American Airlines', 'Frontier']), estimatedCost: 'From $300 USD', durationHours: 1.8, frequency: 'Daily' },
  { id: 'mbj-jfk', origin: MBJ, destination: destinations.jfk, airlines: ['JetBlue', 'Delta'], airlineWebsites: buildWebsites(['JetBlue', 'Delta']), estimatedCost: 'From $370 USD', durationHours: 3.8, frequency: 'Daily' },
  { id: 'mbj-yyz', origin: MBJ, destination: destinations.yyz, airlines: ['Air Canada', 'WestJet', 'Sunwing'], airlineWebsites: buildWebsites(['Air Canada', 'WestJet', 'Sunwing']), estimatedCost: 'From $460 USD', durationHours: 4.1, frequency: 'Daily seasonal' },
  { id: 'mbj-lhr', origin: MBJ, destination: destinations.lhr, airlines: ['Virgin Atlantic', 'British Airways'], airlineWebsites: buildWebsites(['Virgin Atlantic', 'British Airways']), estimatedCost: 'From $790 USD', durationHours: 9.4, frequency: 'Several weekly' },
  { id: 'mbj-atl', origin: MBJ, destination: destinations.atl, airlines: ['Delta'], airlineWebsites: buildWebsites(['Delta']), estimatedCost: 'From $390 USD', durationHours: 3.0, frequency: 'Daily' },
  { id: 'mbj-mco', origin: MBJ, destination: destinations.mco, airlines: ['Southwest', 'JetBlue'], airlineWebsites: buildWebsites(['Southwest', 'JetBlue']), estimatedCost: 'From $330 USD', durationHours: 2.1, frequency: 'Several weekly' },
  { id: 'mbj-phl', origin: MBJ, destination: destinations.phl, airlines: ['American Airlines'], airlineWebsites: buildWebsites(['American Airlines']), estimatedCost: 'From $420 USD', durationHours: 3.7, frequency: 'Weekly/seasonal' },
  { id: 'mbj-clt', origin: MBJ, destination: destinations.clt, airlines: ['American Airlines'], airlineWebsites: buildWebsites(['American Airlines']), estimatedCost: 'From $410 USD', durationHours: 3.0, frequency: 'Daily' },
  { id: 'mbj-iad', origin: MBJ, destination: destinations.iad, airlines: ['United Airlines'], airlineWebsites: buildWebsites(['United Airlines']), estimatedCost: 'From $430 USD', durationHours: 3.5, frequency: 'Several weekly' },
  { id: 'mbj-iah', origin: MBJ, destination: destinations.iah, airlines: ['United Airlines'], airlineWebsites: buildWebsites(['United Airlines']), estimatedCost: 'From $470 USD', durationHours: 3.6, frequency: 'Several weekly' },
  { id: 'mbj-dfw', origin: MBJ, destination: destinations.dfw, airlines: ['American Airlines'], airlineWebsites: buildWebsites(['American Airlines']), estimatedCost: 'From $510 USD', durationHours: 4.0, frequency: 'Several weekly' },
  { id: 'mbj-cun', origin: MBJ, destination: destinations.cun, airlines: ['TUI', 'Charter/seasonal'], airlineWebsites: buildWebsites(['TUI', 'Charter/seasonal']), estimatedCost: 'From $390 USD', durationHours: 1.7, frequency: 'Seasonal' },
  { id: 'mbj-bgi', origin: MBJ, destination: destinations.bgi, airlines: ['InterCaribbean', 'Caribbean Airlines'], airlineWebsites: buildWebsites(['InterCaribbean', 'Caribbean Airlines']), estimatedCost: 'From $480 USD', durationHours: 3.0, frequency: 'Connecting' },
  { id: 'mbj-ams', origin: MBJ, destination: destinations.ams, airlines: ['KLM', 'TUI fly'], airlineWebsites: buildWebsites(['KLM', 'TUI fly']), estimatedCost: 'From $850 USD', durationHours: 10.0, frequency: 'Seasonal' },
  { id: 'mbj-fra', origin: MBJ, destination: destinations.fra, airlines: ['Condor', 'Eurowings Discover'], airlineWebsites: buildWebsites(['Condor', 'Eurowings Discover']), estimatedCost: 'From $880 USD', durationHours: 10.4, frequency: 'Seasonal' }
];
