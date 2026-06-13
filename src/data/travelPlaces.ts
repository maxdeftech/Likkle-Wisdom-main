export type TravelCategory = 'hotels' | 'villas' | 'airbnb' | 'nature' | 'culture' | 'adventure';

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
  }
];
