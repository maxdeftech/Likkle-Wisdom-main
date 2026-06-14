export type TravelCategory = 'hotels' | 'villas' | 'airbnb' | 'nature' | 'culture' | 'adventure' | 'airports';

export interface TravelPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: TravelCategory;
  averageCost?: string;
  description: string;
  website?: string;
  social?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  imageUrl?: string;
}

export const travelCategoryMeta: Record<TravelCategory | 'all' | 'prices', { label: string; icon: string; color: string }> = {
  hotels: { label: 'Hotels & Resorts', icon: 'hotel', color: '#38bdf8' },
  villas: { label: 'Villas', icon: 'villa', color: '#a78bfa' },
  airbnb: { label: 'Air BnBs', icon: 'home', color: '#fb7185' },
  nature: { label: 'Natural Attractions', icon: 'park', color: '#22c55e' },
  culture: { label: 'Culture & History', icon: 'museum', color: '#f59e0b' },
  adventure: { label: 'Adventure & Eco-Tourism', icon: 'hiking', color: '#14b8a6' },
  airports: { label: 'Airports', icon: 'flight_takeoff', color: '#f97316' },
  prices: { label: 'By Price Range', icon: 'payments', color: '#f4d125' },
  all: { label: 'All', icon: 'map', color: '#13ec5b' }
};

export const travelPlaces: TravelPlace[] = [
  {
    id: 'dunns-river-falls',
    name: "Dunn's River Falls",
    lat: 18.4154,
    lng: -77.1348,
    category: 'adventure',
    averageCost: '$25 USD entry',
    description: "A terraced waterfall near Ocho Rios where visitors climb cool limestone steps with guides. The area is one of Jamaica's best-known natural attractions and has long been tied to coastal leisure and local craft markets.",
    website: 'https://www.dunnsriverfallsja.com/',
    social: { instagram: 'https://www.instagram.com/dunnsriverfallsja/' },
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blue-lagoon',
    name: 'Blue Lagoon',
    lat: 18.1782,
    lng: -76.3806,
    category: 'nature',
    averageCost: 'Free viewing',
    description: "This Portland lagoon is famous for deep blue-green water fed by freshwater springs and the sea. It became internationally recognized through film and tourism, but still feels rooted in Jamaica's lush eastern coast.",
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'ricks-cafe',
    name: "Rick's Cafe",
    lat: 18.2568,
    lng: -78.3663,
    category: 'adventure',
    averageCost: 'Free entry',
    description: "A Negril cliffside landmark known for sunset views, live music, and cliff jumping. Since the 1970s it has been a gathering point for visitors wanting the West End's dramatic sea views.",
    website: 'https://rickscafejamaica.com/',
    social: { instagram: 'https://www.instagram.com/rickscafejamaica/' },
    imageUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'bob-marley-museum',
    name: 'Bob Marley Museum',
    lat: 18.0179,
    lng: -76.7796,
    category: 'culture',
    averageCost: '$25 USD tour',
    description: "The former Kingston home and studio of Bob Marley preserves rooms, memorabilia, and stories from the reggae icon's life. It is one of the island's most important cultural stops for music history.",
    website: 'https://www.bobmarleymuseum.com/',
    social: { instagram: 'https://www.instagram.com/bobmarleymuseum/' },
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'devon-house',
    name: 'Devon House',
    lat: 18.0175,
    lng: -76.7890,
    category: 'culture',
    averageCost: '$15 USD tour',
    description: "Devon House is a 19th-century mansion built by George Stiebel, Jamaica's first Black millionaire. The grounds are now a beloved Kingston stop for heritage tours, patties, and ice cream.",
    website: 'https://www.devonhouseja.com/',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blue-mountains',
    name: 'Blue Mountains',
    lat: 18.0760,
    lng: -76.5900,
    category: 'nature',
    averageCost: '$30 USD guided hike',
    description: "The Blue Mountains rise above Kingston and eastern Jamaica with misty peaks, coffee farms, and hiking trails. The area is part of a UNESCO-listed landscape valued for biodiversity and Maroon heritage.",
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'seven-mile-beach',
    name: 'Negril Seven Mile Beach',
    lat: 18.2899,
    lng: -78.3372,
    category: 'nature',
    averageCost: 'Free',
    description: "Seven Mile Beach is a long stretch of white sand and calm water along Negril's coast. It helped shape Jamaica's laid-back beach tourism and remains popular for swimming, restaurants, and sunset walks.",
    imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'rose-hall',
    name: 'Rose Hall Great House',
    lat: 18.5160,
    lng: -77.8186,
    category: 'culture',
    averageCost: '$30 USD tour',
    description: "Rose Hall is an 18th-century plantation great house near Montego Bay. Its architecture, estate history, and the legend of Annie Palmer make it one of Jamaica's most visited heritage sites.",
    website: 'https://rosehall.com/',
    imageUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'ys-falls',
    name: 'YS Falls',
    lat: 18.0712,
    lng: -77.8114,
    category: 'adventure',
    averageCost: '$21 USD entry',
    description: "YS Falls sits on a working estate in St. Elizabeth with cascades, river pools, and canopy activities. It is a quieter south coast alternative for travelers who want water, nature, and room to breathe.",
    website: 'https://ysfalls.com/',
    imageUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'pelican-bar',
    name: "Floyd's Pelican Bar",
    lat: 17.8940,
    lng: -77.8338,
    category: 'adventure',
    averageCost: '$25 USD boat ride',
    description: "Built on a sandbar off Jamaica's south coast, Pelican Bar is a rustic wooden bar reached by boat. It is famous for seafood, carved names in the deck, and a uniquely Jamaican sense of place.",
    imageUrl: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'luminous-lagoon',
    name: 'Luminous Lagoon',
    lat: 18.4761,
    lng: -77.6388,
    category: 'nature',
    averageCost: '$25 USD boat tour',
    description: "The lagoon near Falmouth glows at night when movement activates microscopic organisms in the water. It is one of the rare bioluminescent bays visitors can experience by boat.",
    website: 'https://www.glisteningwaters.com/',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'mystic-mountain',
    name: 'Mystic Mountain',
    lat: 18.4218,
    lng: -77.1199,
    category: 'adventure',
    averageCost: '$89 USD package',
    description: "Mystic Mountain overlooks Ocho Rios with rainforest rides, bobsled-inspired attractions, and zipline activities. The park blends adventure tourism with views of Jamaica's north coast.",
    website: 'https://rainforestadventure.com/mystic-mountain-jamaica/',
    imageUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cockpit-country',
    name: 'Cockpit Country',
    lat: 18.3200,
    lng: -77.7300,
    category: 'nature',
    averageCost: '$45 USD guided tour',
    description: "Cockpit Country is a rugged limestone landscape central to Jamaica's ecology and Maroon history. Its forests, caves, and hills are best explored with local guides who know the terrain.",
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'port-royal',
    name: 'Port Royal',
    lat: 17.9360,
    lng: -76.8410,
    category: 'culture',
    averageCost: '$10 USD museum entry',
    description: "Once called one of the busiest ports in the Caribbean, Port Royal was partly destroyed by the 1692 earthquake. Today it offers forts, seafood, and a layered story of piracy, empire, and resilience.",
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'reach-falls',
    name: 'Reach Falls',
    lat: 18.0200,
    lng: -76.3077,
    category: 'nature',
    averageCost: '$10 USD entry',
    description: "Reach Falls in Portland is known for clear pools, cascades, and surrounding rainforest. Its caves and gentle falls make it a favorite for travelers exploring Jamaica's greener eastern parishes.",
    imageUrl: 'https://images.unsplash.com/photo-1520962922320-2038eebab146?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'half-moon',
    name: 'Half Moon Resort',
    lat: 18.5177,
    lng: -77.7826,
    category: 'hotels',
    averageCost: 'From $450 USD/night',
    description: "Half Moon is a luxury Montego Bay resort with beachfront rooms, villas, dining, and resort activities. It has hosted generations of visitors looking for a polished north coast stay.",
    website: 'https://www.halfmoon.com/',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'goldeneye-villas',
    name: 'GoldenEye Villas',
    lat: 18.4065,
    lng: -76.9448,
    category: 'villas',
    averageCost: 'From $600 USD/night',
    description: "GoldenEye in Oracabessa is a villa and resort property connected to Ian Fleming and Jamaica's creative history. Lagoon cottages, beach villas, and lush grounds make it a high-end escape.",
    website: 'https://www.goldeneye.com/',
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'treasure-beach-stays',
    name: 'Treasure Beach Guest Stays',
    lat: 17.8845,
    lng: -77.7660,
    category: 'airbnb',
    averageCost: 'From $80 USD/night',
    description: "Treasure Beach has locally run guest houses, cottages, and Airbnb-style stays along the south coast. The area is known for community tourism, fishing villages, and a slower pace.",
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'nmia-kingston',
    name: 'Norman Manley International Airport',
    lat: 17.9357,
    lng: -76.7875,
    category: 'airports',
    description: "Norman Manley International (KIN) serves Kingston and is Jamaica's second-busiest airport. It handles domestic and international flights connecting the capital to North America, the UK, and the Caribbean.",
    website: 'https://www.nmia.aero/',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sbj-montego-bay',
    name: 'Sangster International Airport',
    lat: 18.5037,
    lng: -77.9134,
    category: 'airports',
    description: "Sangster International (MBJ) in Montego Bay is Jamaica's busiest airport and a major hub for Caribbean tourism. It connects Jamaica to dozens of international destinations with year-round and seasonal service.",
    website: 'https://www.mbjairport.com/',
    imageUrl: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sandals-montego-bay',
    name: 'Sandals Montego Bay',
    lat: 18.5190,
    lng: -77.8854,
    category: 'hotels',
    averageCost: 'From $350 USD/night (all-inclusive)',
    description: "Sandals Montego Bay is the original Sandals resort and a flagship of Jamaica's all-inclusive hotel market. It sits directly on the beach near the airport and offers watersports, fine dining, and couples-focused amenities.",
    website: 'https://www.sandals.com/montego-bay/',
    social: { instagram: 'https://www.instagram.com/sandalsresorts/', facebook: 'https://www.facebook.com/Sandals' },
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'round-hill-hotel',
    name: 'Round Hill Hotel & Villas',
    lat: 18.5056,
    lng: -78.0451,
    category: 'hotels',
    averageCost: 'From $500 USD/night',
    description: 'Round Hill is a historic Hanover resort known for understated elegance, hillside cottages, and a private beach. It has hosted guests including US presidents and remains a benchmark for Jamaican luxury hospitality.',
    website: 'https://www.roundhilljamaica.com/',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'rockhouse-hotel',
    name: 'Rockhouse Hotel',
    lat: 18.2780,
    lng: -78.3540,
    category: 'hotels',
    averageCost: 'From $175 USD/night',
    description: 'Rockhouse is a Negril cliff-side boutique hotel built into the West End rocks. It is known for open-air studios, a thatched spa, a saltwater infinity pool, and direct sea access. It has held consistent international recognition for design.',
    website: 'https://www.rockhousehotel.com/',
    social: { instagram: 'https://www.instagram.com/rockhousehotel/' },
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'jake-s-hotel',
    name: "Jake's Hotel, Villas & Spa",
    lat: 17.8845,
    lng: -77.7350,
    category: 'hotels',
    averageCost: 'From $145 USD/night',
    description: "Jake's is a boutique hotel on Jamaica's south coast in Treasure Beach. The property is artist-designed with eclectic rooms, a saltwater pool, and strong ties to community tourism and sustainability.",
    website: 'https://www.jakeshotel.com/',
    social: { instagram: 'https://www.instagram.com/jakeshotel/' },
    imageUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'green-grotto-caves',
    name: 'Green Grotto Caves',
    lat: 18.4373,
    lng: -77.3247,
    category: 'nature',
    averageCost: '$20 USD entry',
    description: 'Green Grotto Caves near Runaway Bay is a limestone cave network with underground lake, stalactites, and colonial-era history. Guided tours wind through chambers that were used as refuge by Spanish colonists and later as storage during Prohibition.',
    website: 'https://www.greengrottocavesja.com/',
    imageUrl: 'https://images.unsplash.com/photo-1516298773066-c48f8e9bd2b1?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'mayfield-falls',
    name: 'Mayfield Falls',
    lat: 18.2760,
    lng: -78.1410,
    category: 'nature',
    averageCost: '$15 USD entry',
    description: "Mayfield Falls in Westmoreland is a series of cascades and natural pools along a clear river. It is quieter than Dunn's River and favored for wading, swimming, and a more off-the-beaten-path experience in Jamaica's interior.",
    website: 'https://www.mayfieldwaterfalls.com/',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'rio-grande-rafting',
    name: 'Rio Grande River Rafting',
    lat: 18.1547,
    lng: -76.4124,
    category: 'adventure',
    averageCost: '$85 USD per raft (2 persons)',
    description: 'The Rio Grande in Portland offers bamboo raft rides along a scenic river through rainforest. This tradition began as a way to transport bananas and was popularized by Errol Flynn. Guides navigate the calm river while passengers take in jungle scenery.',
    website: 'https://www.jamaicaraftingontheriograndeportland.com/',
    imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'national-gallery-jamaica',
    name: 'National Gallery of Jamaica',
    lat: 17.9774,
    lng: -76.7879,
    category: 'culture',
    averageCost: '$3 USD entry',
    description: "The National Gallery of Jamaica in Kingston holds the country's primary collection of Jamaican art from the colonial era to contemporary work. Its holdings include Edna Manley sculptures and intuitionist art. It is the definitive stop for Jamaican visual arts.",
    website: 'https://www.nationalgalleryofjamaica.com/',
    social: { instagram: 'https://www.instagram.com/natgalleryja/', facebook: 'https://www.facebook.com/NationalGalleryofJamaica' },
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'trench-town-culture-yard',
    name: 'Trench Town Culture Yard',
    lat: 17.9988,
    lng: -76.8035,
    category: 'culture',
    averageCost: '$10 USD tour',
    description: "Trench Town Culture Yard is the Government Yard in Kingston where Bob Marley lived and where reggae as a movement took shape. The site preserves original government yard structures and memorabilia tied to Jamaica's most globally influential music tradition.",
    website: 'https://www.visitjamaica.com/',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'spanish-town-square',
    name: 'Spanish Town Historic Square',
    lat: 17.9917,
    lng: -76.9556,
    category: 'culture',
    averageCost: 'Free',
    description: "Spanish Town was Jamaica's capital under both Spanish and British rule. The historic square contains the ruins of a King's House, a Rodney Memorial, the Old King's House Archaeological Museum, and some of the oldest colonial architecture remaining in the Caribbean.",
    imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'firefly-noel-coward',
    name: "Firefly - Noel Coward's Estate",
    lat: 18.3869,
    lng: -76.8695,
    category: 'culture',
    averageCost: '$15 USD entry',
    description: "Firefly is the hilltop home of English playwright Noel Coward above Oracabessa. Preserved largely as he left it, the house offers sweeping views of the north coast, original furnishings, and a look into Jamaica's role in mid-century creative life.",
    website: 'https://www.visitjamaica.com/',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'chukka-caribbean-adventures',
    name: 'Chukka Caribbean Adventures',
    lat: 18.4521,
    lng: -77.6612,
    category: 'adventure',
    averageCost: 'From $60 USD per activity',
    description: "Chukka is Jamaica's largest eco-adventure operator with multiple sites across the island. Offerings include canopy zip-lines, ATV rides, horseback-riding on the beach, river tubing, and cultural village tours. The main hub is near Braco in Trelawny.",
    website: 'https://www.chukka.com/',
    social: { instagram: 'https://www.instagram.com/chukkacaribbean/', facebook: 'https://www.facebook.com/Chukka' },
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blue-hole-mineral-spring',
    name: 'Blue Hole Mineral Spring',
    lat: 18.0240,
    lng: -77.7842,
    category: 'adventure',
    averageCost: '$10 USD entry',
    description: 'Blue Hole Mineral Spring in Westmoreland is a natural sinkhole with strikingly clear blue water. Visitors can jump from platforms or rope swings into the pool. The site is locally operated and retains an authentic, community-run character.',
    imageUrl: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'strawberry-hill',
    name: 'Strawberry Hill Resort',
    lat: 18.0602,
    lng: -76.7367,
    category: 'villas',
    averageCost: 'From $350 USD/night',
    description: 'Strawberry Hill sits in the Blue Mountains above Kingston at 3,100 feet. The resort offers Georgian-style cottages, a spa using Blue Mountain coffee-based treatments, and views that look south to the sea. Chris Blackwell developed it from a former great house.',
    website: 'https://www.strawberryhillhotel.com/',
    social: { instagram: 'https://www.instagram.com/strawberryhilljamaica/' },
    imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80'
  }
];
