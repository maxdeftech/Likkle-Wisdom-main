/**
 * Content for the Jamaican History page (Discover → Jamaican History).
 * Images use placeholder URLs; replace with your own assets or CDN for production.
 */

export const NATIONAL_HEROES = [
  { name: 'Marcus Garvey', role: 'Pan-Africanist leader', year: '1887–1940', blurb: 'Founder of the UNIA, advocated for Black self-reliance and African repatriation. "Emancipate yourselves from mental slavery."' },
  { name: 'Nanny of the Maroons', role: 'Freedom fighter', year: 'c. 1686–c. 1755', blurb: 'Leader of the Windward Maroons; symbol of resistance and freedom. Jamaica’s only female National Hero.' },
  { name: 'Paul Bogle', role: 'Baptist deacon & activist', year: '1822–1865', blurb: 'Led the Morant Bay Rebellion in 1865, fighting for justice and land rights for the poor.' },
  { name: 'George William Gordon', role: 'Politician & martyr', year: '1820–1865', blurb: 'Supported the poor and was executed after the Morant Bay uprising. A voice for the oppressed.' },
  { name: 'Norman Manley', role: 'Statesman & lawyer', year: '1893–1969', blurb: 'Founder of the PNP, led the push for self-government and universal suffrage.' },
  { name: 'Alexander Bustamante', role: 'Labour leader & first PM', year: '1884–1977', blurb: 'Founder of the JLP and the BITU; Jamaica’s first Prime Minister at Independence in 1962.' },
  { name: 'Sam Sharpe', role: 'Baptist preacher & rebel', year: '1801–1832', blurb: 'Led the Christmas Rebellion of 1831–32, one of the largest slave uprisings in the British Caribbean.' },
];

export const ICONIC_PLACES = [
  { name: "Dunn's River Falls", established: 'Around 1657 (Ocho Rios)', description: 'One of Jamaica’s most famous natural attractions. Terraced waterfalls cascade over natural limestone steps into the Caribbean Sea. Climbing the falls is a beloved experience for visitors.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800' },
  { name: 'Blue Mountain Peak', established: 'Natural landmark', description: 'At 2,256 m (7,402 ft), the highest point in Jamaica. Home to world-renowned Blue Mountain coffee and lush rainforest.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
  { name: 'Port Royal', established: '1518', description: 'Once called "the wickedest city on Earth," a historic pirate haven and British naval base. Much of the 17th-century town sank in the 1692 earthquake.', image: 'https://images.unsplash.com/photo-1580674285054-6ae2d1d43eb7?w=800' },
  { name: 'Rose Hall Great House', established: '1770s', description: 'Famous Georgian great house in Montego Bay, linked to the legend of Annie Palmer, the "White Witch of Rose Hall."', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
];

export const CURRENCY_IMAGES = [
  { label: 'Older Jamaican banknotes (pre-decimal)', url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600' },
  { label: 'Jamaican pounds & early dollars', url: 'https://images.unsplash.com/photo-1613544725278-f2b9842350fc?w=600' },
  { label: 'Current Jamaican dollar (JMD)', url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600' },
];

export const BRITISH_RULE = {
  title: 'British Rule',
  intro: 'Jamaica came under English control in 1655 when the British captured the island from Spain. For over 300 years it remained a British colony, central to the Atlantic sugar and slave economy.',
  points: [
    'Spanish colonizers (1494–1655) were displaced by the English; the island became a Crown colony.',
    'Sugar plantations dominated; enslaved Africans provided the labour that made Jamaica one of Britain’s most valuable colonies.',
    'After emancipation (1834–38), indentured labour from India and China was introduced.',
    'Crown Colony government meant power rested with London until the 20th century.',
    'Movements for self-government grew; universal adult suffrage came in 1944, and Jamaica gained independence on August 6, 1962.',
  ],
};

export const TAINOS = {
  title: 'The Taínos',
  intro: 'Before Columbus, Jamaica was home to the Taíno people, part of the Arawak-speaking groups of the Caribbean. They called the island Xaymaca — "land of wood and water."',
  points: [
    'Taínos lived in villages (yucayeques), farmed cassava, sweet potato, and maize, and fished.',
    'They had a rich spiritual and social life, with caciques (chiefs), behiques (healers), and zemis (spirits/gods).',
    'Spanish arrival brought disease, forced labour, and violence; within decades the Taíno population collapsed.',
    'Today, Jamaican culture still carries Taíno influences in place names, words, and food (e.g. bammy, jerk techniques).',
  ],
};

export const COLUMBUS_IN_JAMAICA = {
  title: 'Christopher Columbus in Jamaica',
  intro: 'Columbus first reached Jamaica on May 4, 1494, during his second voyage. He claimed the island for Spain and later spent a year stranded there (1503–1504).',
  impact: [
    'His arrival began the colonial period that led to the near destruction of the Taíno people.',
    'Jamaica became a Spanish colony until the English takeover in 1655.',
    'The encounter set in motion the transatlantic slave trade and plantation economy that shaped Jamaica for centuries.',
  ],
};

export const SLAVERY_AND_OVERCOMING = {
  title: 'Slavery in Jamaica & How We Overcame',
  intro: 'Under British rule, Jamaica became one of the largest sugar producers in the world, built on the forced labour of enslaved Africans. Their resistance and the long fight for freedom define our history.',
  sections: [
    { heading: 'The plantation system', text: 'Enslaved people worked on sugar, coffee, and other estates under brutal conditions. Mortality was high; the population was maintained by the continuous slave trade from Africa.' },
    { heading: 'Resistance', text: 'Maroon communities (descendants of escaped Africans) fought and won treaties. Revolts, including the Christmas Rebellion (1831–32) led by Sam Sharpe, accelerated the push for abolition.' },
    { heading: 'Abolition & apprenticeship', text: 'Slavery was abolished in 1834; a period of "apprenticeship" followed until full freedom in 1838.' },
    { heading: 'Legacy & overcoming', text: 'Jamaicans built a free society despite inequality and colonial control. Independence (1962), culture, music, sport, and the strength of our people are the legacy of that overcoming.' },
  ],
};

export const MUSEUMS = [
  { name: 'Bob Marley Museum', location: '56 Hope Rd, Kingston', description: 'The former home and studio of Bob Marley. Exhibits, memorabilia, and his legacy in reggae and Rastafari.', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800' },
  { name: 'National Museum of Jamaica', location: 'Spanish Town / Kingston', description: 'Holds collections on Jamaican history, Taíno artefacts, slavery, and cultural heritage.' },
  { name: 'Port Royal Maritime Museum', location: 'Port Royal', description: 'Showcases the maritime and pirate history of Port Royal and the 1692 earthquake.' },
];

export const PERSONS_LIKE_MS_LOU = [
  { name: 'Louise Bennett-Coverley (Miss Lou)', role: 'Poet, folklorist, performer', blurb: 'Brought Jamaican Patois to the stage and radio; celebrated Jamaican language and culture. "Manners out-rule money."', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400' },
  { name: 'Bob Marley', role: 'Musician & global icon', blurb: 'Spread reggae and messages of peace, love, and resistance worldwide. One of the greatest musicians of the 20th century.' },
  { name: 'Usain Bolt', role: 'Sprinter', blurb: 'Eight-time Olympic gold medallist; "the fastest man alive." Put Jamaica on the map in athletics.' },
  { name: 'Shelly-Ann Fraser-Pryce', role: 'Sprinter', blurb: 'Multiple Olympic and World Championship gold medallist; one of the greatest female sprinters ever.' },
];

export const JAMAICAN_CUISINE = [
  { name: 'Ackee and Saltfish', description: 'Jamaica’s national dish. Ackee (fruit) cooked with salted cod, onions, tomatoes, and spices, often with fried dumplings or boiled green bananas.' },
  { name: 'Jerk', description: 'Meat or fish marinated with jerk spice (allspice, scotch bonnet, thyme, etc.) and slow-cooked over pimento wood. Originated with the Maroons.' },
  { name: 'Curry Goat', description: 'Goat meat in a rich curry sauce, often served with rice and peas — a staple at celebrations.' },
  { name: 'Rice and Peas', description: 'Rice cooked with coconut milk and kidney beans (or gungo peas), often served with Sunday dinner.' },
  { name: 'Bammy', description: 'Flatbread made from cassava; a Taíno legacy, often eaten with fish.' },
  { name: 'Escovitch Fish', description: 'Fried fish topped with a spicy vinegar-based sauce with carrots and peppers.' },
];

export const NATIONAL_SYMBOLS = [
  { name: 'National dish', value: 'Ackee and Saltfish', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
  { name: 'National fruit', value: 'Ackee', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600' },
  { name: 'National bird', value: 'Doctor Bird (Red-billed Streamertail)', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600' },
  { name: 'National flower', value: 'Lignum Vitae', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600' },
  { name: 'National motto', value: 'Out of Many, One People', image: null },
  { name: 'Flag', value: 'Black, gold, green — diagonal cross (gold) with black and green triangles', image: 'https://images.unsplash.com/photo-1523482580671-f216baa6d92f?w=600' },
];
