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
  },
  {
    id: 'black-river-safari',
    name: 'Black River Safari',
    lat: 18.0271,
    lng: -77.8505,
    category: 'nature',
    averageCost: '$20 USD boat tour',
    description: "The Black River is Jamaica's longest river and hosts crocodile-watching safari boat tours through mangrove ecosystems in St. Elizabeth. The area is protected wetland, home to American crocodiles, herons, and rare bird species. Locally operated tours depart from Black River town.",
    website: 'https://www.visitjamaica.com/listing/black-river-safari/',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'negril-royal-palms',
    name: 'Royal Palms Reserve',
    lat: 18.3000,
    lng: -78.3400,
    category: 'nature',
    averageCost: '$10 USD entry',
    description: "The Royal Palms Reserve is a protected wetland nature park in Negril. The reserve features a boardwalk through a palm forest, bird watching, and interpretive signage about Jamaica's coastal ecology. It is managed for conservation and low-impact eco-tourism.",
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'montego-bay-marine-park',
    name: 'Montego Bay Marine Park',
    lat: 18.4900,
    lng: -77.9200,
    category: 'nature',
    averageCost: 'Free access, tours vary',
    description: "The Montego Bay Marine Park protects one of Jamaica's key coral reef ecosystems. It spans from the airport to the Great River and is managed for coral restoration, sea turtle protection, and sustainable snorkelling and diving access.",
    website: 'https://www.mbmp.org/',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'portland-bight',
    name: 'Portland Bight Protected Area',
    lat: 17.8000,
    lng: -77.1500,
    category: 'nature',
    averageCost: '$15 USD guided tour',
    description: "Portland Bight is one of the largest protected areas in Jamaica, covering mangroves, cays, and offshore reefs on the south coast. The area includes Pigeon Island, a Ramsar wetland site, and is important for manatees, crocodiles, and migratory birds.",
    imageUrl: 'https://images.unsplash.com/photo-1520962922320-2038eebab146?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'nanny-falls',
    name: "Nanny Falls (Moore Town)",
    lat: 18.1100,
    lng: -76.3500,
    category: 'nature',
    averageCost: '$15 USD guided hike',
    description: "Nanny Falls near Moore Town in Portland is a scenic waterfall accessible through the ancestral lands of the Windward Maroons. Visits are arranged through the Moore Town community and provide cultural as well as natural context for one of Jamaica's most historically significant communities.",
    imageUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'jamaica-military-museum',
    name: 'Jamaica Military Museum & Library',
    lat: 17.9990,
    lng: -76.7910,
    category: 'culture',
    averageCost: '$5 USD entry',
    description: 'The Jamaica Military Museum in Kingston documents the history of the Jamaica Defence Force from its colonial roots through independence to the present. Exhibits cover uniforms, weapons, historic documents, and the role of the military in Jamaican national life.',
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'liberty-hall-kingston',
    name: 'Liberty Hall - Marcus Garvey Museum',
    lat: 18.0013,
    lng: -76.7943,
    category: 'culture',
    averageCost: '$5 USD entry',
    description: "Liberty Hall in Kingston is the restored headquarters of Marcus Garvey's Universal Negro Improvement Association. The museum presents Garvey's life, the Pan-African movement, and the UNIA's global significance through exhibits and an interpretive centre.",
    website: 'https://www.visitjamaica.com/listing/liberty-hall-the-legacy-of-marcus-garvey/',
    imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'falmouth-historic-town',
    name: 'Falmouth Historic Town',
    lat: 18.4996,
    lng: -77.6580,
    category: 'culture',
    averageCost: 'Free (tours available)',
    description: 'Falmouth in Trelawny is one of the best-preserved Georgian towns in the Caribbean. Its courthouse, churches, and merchant buildings date from the sugar era when it was a prosperous port town. Heritage tours are available and the town is now a port of call for cruise ships.',
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'coyaba-river-garden-museum',
    name: 'Coyaba River Garden & Museum',
    lat: 18.4180,
    lng: -77.1050,
    category: 'culture',
    averageCost: '$10 USD entry',
    description: 'Coyaba River Garden & Museum near Ocho Rios is set on the Shaw Park hillside and covers the history of Jamaica from pre-Columbian Taino culture through the colonial era to independence. The garden contains streams, waterfalls, and native plantings around the museum building.',
    website: 'https://www.visitjamaica.com/listing/coyaba-river-garden-and-museum/',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'seville-great-house',
    name: 'Seville Heritage Park',
    lat: 18.4540,
    lng: -77.2160,
    category: 'culture',
    averageCost: '$10 USD entry',
    description: "Seville Heritage Park near St. Ann's Bay is built on the site of Jamaica's first Spanish capital and the later Seville Great House. Archaeological excavations have uncovered Taino, Spanish, and British layers. The park covers 850 acres of the island's most historically layered landscape.",
    website: 'https://www.visitjamaica.com/listing/seville-heritage-park/',
    imageUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'zipline-ocho-rios',
    name: 'Ocho Rios Zipline at Chukka',
    lat: 18.3890,
    lng: -77.1770,
    category: 'adventure',
    averageCost: 'From $65 USD',
    description: "Chukka's Ocho Rios canopy and zipline experience takes guests through a rainforest canopy above the north coast. Multiple platforms and traverses of varying difficulty make it accessible to most visitors. Guides provide safety instruction and natural history commentary throughout.",
    website: 'https://www.chukka.com/',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cliff-jumping-negril',
    name: 'Negril Cliffs (West End)',
    lat: 18.2600,
    lng: -78.3700,
    category: 'adventure',
    averageCost: 'Free / bar spend',
    description: "The West End Road in Negril runs along a series of volcanic rock cliffs above the sea. Multiple bars and hotels along the cliffs offer jumping platforms and diving ledges at varying heights. The area is informal, locally run, and offers some of the most dramatic sunset views in Jamaica.",
    imageUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'bamboo-avenue',
    name: 'Bamboo Avenue',
    lat: 18.0500,
    lng: -77.7200,
    category: 'adventure',
    averageCost: 'Free roadside stop',
    description: 'Bamboo Avenue is a 3km stretch of road in St. Elizabeth lined with a dense canopy of towering bamboo that forms a natural tunnel. It is a photogenic stop on the south coast route and is often included in tour itineraries between Kingston and Negril.',
    imageUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'appleton-estate',
    name: 'Appleton Estate Rum Tour',
    lat: 18.0900,
    lng: -77.7600,
    category: 'adventure',
    averageCost: '$30 USD tour',
    description: 'Appleton Estate in Nassau Valley, St. Elizabeth, has been producing Jamaican rum since the 1740s. The estate tour covers the cane fields, distillery, aging warehouses, and a tasting of single estate rums. It is one of the oldest continuously operating sugar estates in the western hemisphere.',
    website: 'https://www.appletonestate.com/',
    social: { instagram: 'https://www.instagram.com/appletonestate/' },
    imageUrl: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'couples-sans-souci',
    name: 'Couples Sans Souci',
    lat: 18.4098,
    lng: -77.0612,
    category: 'hotels',
    averageCost: 'From $280 USD/night (all-inclusive)',
    description: "Couples Sans Souci near Ocho Rios is a cliffside all-inclusive resort with a mineral spring pool, spa, and multiple dining options. The property combines romance-focused amenities with the natural geology of Jamaica's north coast limestone cliffs.",
    website: 'https://www.couples.com/resort/couples-sans-souci',
    social: { instagram: 'https://www.instagram.com/couplesresorts/' },
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'moon-palace-jamaica',
    name: 'Moon Palace Jamaica Grande',
    lat: 18.4030,
    lng: -76.9720,
    category: 'hotels',
    averageCost: 'From $200 USD/night (all-inclusive)',
    description: 'Moon Palace Jamaica Grande sits on a private beach in Ocho Rios. The large resort features multiple pools, diverse dining, a full-service spa, and water sports. It is well-suited for families and larger groups seeking a comprehensive all-inclusive north coast experience.',
    website: 'https://www.moonpalacejamaicangrande.com/',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'riu-negril',
    name: 'RIU Negril',
    lat: 18.3060,
    lng: -78.3450,
    category: 'hotels',
    averageCost: 'From $170 USD/night (all-inclusive)',
    description: "RIU Negril is an all-inclusive beachfront resort on Seven Mile Beach. The property offers ocean-view rooms, multiple pools and restaurants, entertainment, and easy access to Negril's beach strip. It is consistently popular with North American and European visitors.",
    website: 'https://www.riu.com/en/hotel/jamaica/negril/hotel-riu-negril/',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'trident-villa-portland',
    name: 'Trident Hotel & Villas',
    lat: 18.1700,
    lng: -76.4500,
    category: 'villas',
    averageCost: 'From $700 USD/night',
    description: "Trident Hotel sits on rocky cliffs above the sea in Port Antonio, Portland. The boutique property features suites and private villas with individual pools, butler service, and curated Jamaica experiences. It is one of the island's most celebrated small luxury properties.",
    website: 'https://www.tridentportantonio.com/',
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'tensing-pen-negril',
    name: 'Tensing Pen Resort',
    lat: 18.2650,
    lng: -78.3720,
    category: 'villas',
    averageCost: 'From $220 USD/night',
    description: 'Tensing Pen on the Negril West End cliffs is a low-impact, eco-conscious cottage resort. It occupies a forested clifftop with rocky swimming pools at sea level, handcrafted cottages, and a peaceful atmosphere that reflects the original character of Negril before mass tourism.',
    website: 'https://www.tensing.com/',
    imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80'
  },

  /* ── Additional reputable places ──────────────────── */
  {
    id: 'doctors-cave-beach',
    name: "Doctor's Cave Beach",
    lat: 18.4960,
    lng: -77.9248,
    category: 'nature',
    averageCost: '$6 USD entry',
    description: "One of Montego Bay's most famous beaches, Doctor's Cave has been attracting visitors since the early 1900s when its mineral-rich waters were believed to have curative powers. The calm turquoise water and fine white sand make it a must-visit on the Hip Strip.",
    website: 'https://www.doctorscavebathingclub.com/',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'frenchmans-cove',
    name: "Frenchman's Cove",
    lat: 18.1850,
    lng: -76.4240,
    category: 'nature',
    averageCost: '$10 USD entry',
    description: "Frenchman's Cove in Port Antonio is a river-meets-sea beach surrounded by lush tropical forest. The fresh river water flows directly into a sheltered cove of the Caribbean Sea, creating one of Jamaica's most picturesque swimming spots.",
    imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'konoko-falls',
    name: 'Konoko Falls & Park',
    lat: 18.4100,
    lng: -77.1150,
    category: 'adventure',
    averageCost: '$25 USD entry',
    description: "Konoko Falls and tropical garden is a quieter alternative to Dunn's River Falls in Ocho Rios. The park includes waterfalls, a small zoo with native birds, Taino artefacts, and lush botanical gardens with panoramic views of the north coast.",
    website: 'https://www.konokofalls.com/',
    imageUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'martha-brae-rafting',
    name: 'Martha Brae River Rafting',
    lat: 18.4847,
    lng: -77.6279,
    category: 'adventure',
    averageCost: '$70 USD per raft',
    description: 'Martha Brae rafting near Falmouth takes visitors on a gentle three-mile bamboo raft ride down a scenic river shaded by overhanging trees. Licensed raft captains navigate while sharing local stories and folklore about the river spirit.',
    website: 'https://www.jamaicarafting.com/',
    imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'harmony-hall',
    name: 'Harmony Hall',
    lat: 18.3600,
    lng: -76.8300,
    category: 'culture',
    averageCost: 'Free entry',
    description: "Harmony Hall is an art gallery and craft centre near Oracabessa showcasing Jamaican contemporary art, sculpture, and fine crafts. The restored great house hosts exhibitions, a gift shop, and an Italian restaurant in a peaceful hillside setting.",
    website: 'https://www.harmonyhall.com/',
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'scotchies-jerk',
    name: 'Scotchies Jerk Centre',
    lat: 18.4600,
    lng: -77.6340,
    category: 'culture',
    averageCost: '$10–20 USD per meal',
    description: "Scotchies near Falmouth (with other locations across Jamaica) is among the island's most celebrated jerk stops. Traditional pimento wood-smoked jerk chicken and pork are served on breadfruit leaf in an open-air roadside setting.",
    website: 'https://www.scotchies.com/',
    imageUrl: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'hope-botanical-gardens',
    name: 'Hope Botanical Gardens',
    lat: 18.0175,
    lng: -76.7490,
    category: 'nature',
    averageCost: 'Free entry',
    description: "Hope Botanical Gardens is the largest botanical garden in the Caribbean, covering 200 acres in Kingston. The grounds include a palm avenue, orchid house, sunken garden, and the Hope Zoo. It has been a public green space since the 1870s.",
    website: 'https://www.hopezoo.com/',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'emancipation-park',
    name: 'Emancipation Park',
    lat: 18.0122,
    lng: -76.7844,
    category: 'culture',
    averageCost: 'Free',
    description: "Emancipation Park in New Kingston is a seven-acre urban park opened in 2002 to commemorate emancipation. It features the iconic 'Redemption Song' statue by Laura Facey, a jogging trail, fountains, and well-maintained gardens popular with joggers and families.",
    imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blue-mountain-coffee-tour',
    name: 'Blue Mountain Coffee Tours',
    lat: 18.0842,
    lng: -76.6100,
    category: 'adventure',
    averageCost: '$35 USD tour',
    description: "Several estates in the Blue Mountains offer guided tours of working coffee farms. Visitors learn about cultivation, processing, roasting, and tasting of Jamaica Blue Mountain Coffee — one of the most expensive and sought-after coffees in the world.",
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'winnifred-beach',
    name: 'Winnifred Beach',
    lat: 18.1880,
    lng: -76.3700,
    category: 'nature',
    averageCost: 'Free',
    description: "Winnifred Beach near Port Antonio is a community-managed public beach loved for its local vibe, clear water, reef snorkelling, and beachside food stalls serving fresh fish and festivals. It remains one of the few uncommercialised beaches in Portland.",
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'kingston-waterfront',
    name: 'Kingston Waterfront & Conference Centre',
    lat: 17.9710,
    lng: -76.7920,
    category: 'culture',
    averageCost: 'Free (waterfront area)',
    description: "The Kingston waterfront promenade runs along Ocean Boulevard from the conference centre past craft markets and the ferry terminal. It offers harbour views, evening breezes, and is home to the Jamaica Conference Centre, a regional landmark.",
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sandals-royal-plantation',
    name: 'Sandals Royal Plantation',
    lat: 18.4100,
    lng: -77.0750,
    category: 'hotels',
    averageCost: 'From $500 USD/night (all-inclusive)',
    description: "Sandals Royal Plantation in Ocho Rios is a boutique all-suite, all-butler luxury resort perched on cliffside bluffs overlooking the Caribbean Sea. With only 74 suites, it is the most exclusive property in the Sandals portfolio.",
    website: 'https://www.sandals.com/royal-plantation/',
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'grand-palladium-jamaica',
    name: 'Grand Palladium Jamaica Resort',
    lat: 18.3690,
    lng: -78.1160,
    category: 'hotels',
    averageCost: 'From $180 USD/night (all-inclusive)',
    description: "Grand Palladium sits on a long stretch of private beach in Lucea, Hanover. The all-inclusive resort features multiple themed restaurants, a spa, several pools, and direct beach access. It caters to both families and couples.",
    website: 'https://www.palladiumhotelgroup.com/',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'ochi-beach-club',
    name: 'Ocho Rios Bay Beach',
    lat: 18.4092,
    lng: -77.1077,
    category: 'nature',
    averageCost: 'Free',
    description: "Ocho Rios Bay Beach (also known as Turtle Beach) is the main public beach in town, offering calm waters, reef areas for snorkelling, and easy access to the town centre. Vendors, chair rentals, and watersports operators line the shore.",
    imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'boston-jerk-centre',
    name: 'Boston Bay Jerk Centre',
    lat: 18.1816,
    lng: -76.3349,
    category: 'culture',
    averageCost: '$8–15 USD per meal',
    description: "Boston Bay in Portland is widely recognised as the birthplace of Jamaican jerk cooking. Roadside vendors smoke meat over pimento wood using techniques passed down through generations. The adjacent bay also has surf-worthy waves — a rarity in Jamaica.",
    imageUrl: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'lovers-leap',
    name: "Lover's Leap",
    lat: 17.8680,
    lng: -77.7960,
    category: 'nature',
    averageCost: '$10 USD entry',
    description: "Lover's Leap in St. Elizabeth is a dramatic cliff rising 1,700 feet above the sea on Jamaica's south coast. Named after a folk legend of two enslaved lovers, it offers some of the most expansive coastal views on the island, a lighthouse, and a small restaurant.",
    imageUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'reggae-falls',
    name: 'Reggae Falls',
    lat: 17.9750,
    lng: -76.3600,
    category: 'nature',
    averageCost: '$10 USD entry',
    description: "Reggae Falls near Hillside in St. Thomas is a recently developed natural attraction featuring a tall waterfall with a deep swimming pool at its base. The community-managed site is less crowded than more famous falls and offers a genuine off-the-beaten-path experience.",
    imageUrl: 'https://images.unsplash.com/photo-1520962922320-2038eebab146?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'montego-bay-hip-strip',
    name: 'Montego Bay Hip Strip',
    lat: 18.4980,
    lng: -77.9230,
    category: 'culture',
    averageCost: 'Free to walk',
    description: "Gloucester Avenue, known as the Hip Strip, is Montego Bay's main tourist strip with restaurants, bars, duty-free shops, and nightlife along the waterfront. It runs from Doctor's Cave Beach to the cruise ship pier and is the social centre of tourist Montego Bay.",
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cranbrook-flower-forest',
    name: 'Cranbrook Flower Forest',
    lat: 18.3800,
    lng: -77.2200,
    category: 'nature',
    averageCost: '$10 USD entry',
    description: "Cranbrook Flower Forest near Ocho Rios is a 130-acre tropical garden with scenic riverwalks, swimming holes, and native plants. The grounds follow a river gorge through tropical forest and are quieter than the main Ocho Rios attractions.",
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'island-grill',
    name: 'Island Grill',
    lat: 18.0120,
    lng: -76.7888,
    category: 'culture',
    averageCost: '$5–12 USD per meal',
    description: "Island Grill is Jamaica's popular fast-casual restaurant chain known for jerk chicken, festival, and other Jamaican staples. Multiple locations across Kingston and other parishes make it a reliable, affordable option for authentic local food.",
    imageUrl: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'dunn-river-ocho-rios-craft',
    name: "Ocho Rios Craft Market",
    lat: 18.4079,
    lng: -77.1030,
    category: 'culture',
    averageCost: 'Free entry, items $2–50+',
    description: "The Ocho Rios Craft Market near the cruise ship pier is a large open-air market with dozens of vendors selling handmade Jamaican crafts, wood carvings, straw goods, Blue Mountain coffee, rum, sauces, and clothing. Bargaining is expected.",
    imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'secrets-montego-bay',
    name: 'Secrets St. James Montego Bay',
    lat: 18.5210,
    lng: -77.8440,
    category: 'hotels',
    averageCost: 'From $400 USD/night (all-inclusive)',
    description: "Secrets St. James is an adults-only luxury all-inclusive resort on Montego Bay's Freeport peninsula. It features Unlimited-Luxury amenities including gourmet dining, premium bars, spa services, and beachfront suites with ocean views.",
    website: 'https://www.secretsresorts.com/',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blue-harbour-estate',
    name: 'Blue Harbour Estate',
    lat: 18.3900,
    lng: -76.8750,
    category: 'villas',
    averageCost: 'From $300 USD/night',
    description: "Blue Harbour near Oracabessa was Noel Coward's original Jamaica retreat before he moved to Firefly. The estate is now a private villa rental on the waterfront with its own beach, jetty, and views across the Caribbean — steeped in mid-century creative history.",
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'jakes-treasure-beach-villas',
    name: 'Calabash Bay Villas',
    lat: 17.8830,
    lng: -77.7400,
    category: 'airbnb',
    averageCost: 'From $95 USD/night',
    description: "Several villa-style Airbnb and guest house options line Calabash Bay near Treasure Beach. The area offers a quieter south coast retreat with fishing boats, community tourism, and proximity to Pelican Bar and the Black River.",
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'port-antonio-villas',
    name: 'Port Antonio Hillside Villas',
    lat: 18.1800,
    lng: -76.4480,
    category: 'airbnb',
    averageCost: 'From $110 USD/night',
    description: "Port Antonio's lush hillsides host numerous Airbnb-style villas and guesthouses with sea views. The area is popular with travelers seeking a quieter, greener Jamaica away from the north coast resort strip, with easy access to beaches, waterfalls, and rafting.",
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80'
  }
];
