/**
 * Content for the Jamaican History page (Discover → Jamaican History).
 * No images; all entries include links to Wikipedia and other reputable external sites.
 */

export interface ExternalLink {
  label: string;
  url: string;
}

export const NATIONAL_HEROES: Array<{
  name: string;
  role: string;
  year: string;
  blurb: string;
  links: ExternalLink[];
}> = [
  {
    name: 'Marcus Garvey',
    role: 'Pan-Africanist leader',
    year: '1887–1940',
    blurb: 'Founder of the Universal Negro Improvement Association (UNIA). Advocated for Black self-reliance, economic independence, and African repatriation. His message "Emancipate yourselves from mental slavery" inspired generations and influenced Rastafari and civil rights movements worldwide.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Marcus_Garvey' },
      { label: 'National Library of Jamaica', url: 'https://www.nlj.gov.jm/history-notes/Marcus%20Garvey.pdf' },
    ],
  },
  {
    name: 'Nanny of the Maroons',
    role: 'Freedom fighter',
    year: 'c. 1686–c. 1755',
    blurb: 'Leader of the Windward Maroons in the 18th century. A skilled strategist and spiritual leader, she led resistance against British colonial forces. Jamaica\'s only female National Hero and a lasting symbol of freedom and resistance.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Nanny_of_the_Maroons' },
      { label: 'JIS – National Heroes', url: 'https://jis.gov.jm/information/heroes/nanny-of-the-maroons/' },
    ],
  },
  {
    name: 'Paul Bogle',
    role: 'Baptist deacon & activist',
    year: '1822–1865',
    blurb: 'Led the Morant Bay Rebellion in 1865, marching for justice and land rights for the poor. His stand against injustice cost him his life but galvanized the push for political and social change in Jamaica.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Paul_Bogle' },
      { label: 'JIS – National Heroes', url: 'https://jis.gov.jm/information/heroes/paul-bogle/' },
    ],
  },
  {
    name: 'George William Gordon',
    role: 'Politician & martyr',
    year: '1820–1865',
    blurb: 'Mixed-race politician who spoke for the poor and opposed injustice. Supported the Morant Bay uprising; was executed in its aftermath. Remembered as a voice for the oppressed and for political representation.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/George_William_Gordon' },
      { label: 'JIS – National Heroes', url: 'https://jis.gov.jm/information/heroes/george-william-gordon/' },
    ],
  },
  {
    name: 'Norman Manley',
    role: 'Statesman & lawyer',
    year: '1893–1969',
    blurb: 'Founder of the People\'s National Party (PNP). Led the push for self-government and universal adult suffrage. Premier of Jamaica (1959–1962) and a key architect of the move to independence.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Norman_Manley' },
      { label: 'JIS – National Heroes', url: 'https://jis.gov.jm/information/heroes/norman-manley/' },
    ],
  },
  {
    name: 'Alexander Bustamante',
    role: 'Labour leader & first PM',
    year: '1884–1977',
    blurb: 'Founder of the Jamaica Labour Party (JLP) and the Bustamante Industrial Trade Union (BITU). Jamaica\'s first Prime Minister at Independence (1962–1967). Champion of workers\' rights and independence.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Alexander_Bustamante' },
      { label: 'JIS – National Heroes', url: 'https://jis.gov.jm/information/heroes/sir-alexander-bustamante/' },
    ],
  },
  {
    name: 'Sam Sharpe',
    role: 'Baptist preacher & rebel',
    year: '1801–1832',
    blurb: 'Led the Christmas Rebellion of 1831–32, one of the largest slave uprisings in the British Caribbean. His fight for freedom accelerated the abolition movement; he was executed but is honoured as a National Hero.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Sam_Sharpe' },
      { label: 'JIS – National Heroes', url: 'https://jis.gov.jm/information/heroes/sam-sharpe/' },
    ],
  },
];

export const ICONIC_PLACES: Array<{
  name: string;
  established: string;
  description: string;
  links: ExternalLink[];
}> = [
  {
    name: "Dunn's River Falls",
    established: 'Ocho Rios, St. Ann — developed as attraction from mid-20th century',
    description: 'One of Jamaica\'s most famous natural attractions. Terraced waterfalls cascade over natural limestone steps into the Caribbean Sea. Climbing the falls with guides is a beloved experience for visitors. The area has been used for centuries; today it is a major tourist site with steps and trails.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Dunn%27s_River_Falls' },
      { label: 'Jamaica National Heritage Trust', url: 'http://www.jnht.com/site_dunns_river_falls.php' },
    ],
  },
  {
    name: 'Blue Mountain Peak',
    established: 'Natural landmark — highest point in Jamaica',
    description: 'At 2,256 m (7,402 ft), the highest point in Jamaica. Part of the Blue and John Crow Mountains, a UNESCO World Heritage Site. Home to world-renowned Blue Mountain coffee and lush rainforest with endemic species. Popular for hiking and ecotourism.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Blue_Mountain_Peak' },
      { label: 'UNESCO Blue and John Crow Mountains', url: 'https://whc.unesco.org/en/list/1356/' },
    ],
  },
  {
    name: 'Port Royal',
    established: '1518 (Spanish); British from 1655',
    description: 'Historic port once called "the wickedest city on Earth." A major pirate haven and British naval base in the 17th century. Much of the town sank in the 1692 earthquake; the remaining area is a heritage site with forts, museums, and maritime history.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Port_Royal' },
      { label: 'Jamaica National Heritage Trust – Port Royal', url: 'http://www.jnht.com/site_port_royal.php' },
    ],
  },
  {
    name: 'Rose Hall Great House',
    established: '1770s',
    description: 'Famous Georgian great house in Montego Bay. Linked to the legend of Annie Palmer, the "White Witch of Rose Hall." Today a museum and tour site showcasing plantation-era architecture and Jamaican folklore.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rose_Hall_Great_House' },
      { label: 'Rose Hall official', url: 'https://rosehall.com/' },
    ],
  },
  {
    name: 'Devon House',
    established: '1881',
    description: 'Historic mansion in Kingston built by Jamaica\'s first Black millionaire, George Stiebel. A national heritage site with period furnishings, gardens, and the famous Devon House I Scream and other shops.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Devon_House' },
      { label: 'Devon House', url: 'https://www.devonhousejamaica.com/' },
    ],
  },
];

export const JAMAICAN_CURRENCY: {
  intro: string;
  sections: Array<{ heading: string; text: string }>;
  links: ExternalLink[];
} = {
  intro: 'Jamaica\'s currency evolved from the Jamaican pound (tied to British sterling) to the Jamaican dollar (JMD), which became the sole legal tender in 1969. The Bank of Jamaica issues banknotes and coins featuring national heroes, landmarks, and symbols.',
  sections: [
    { heading: 'Jamaican pound', text: 'Before 1969, Jamaica used the Jamaican pound (£), pegged to the British pound. Banknotes and coins bore colonial and later national imagery.' },
    { heading: 'Decimalisation and the Jamaican dollar', text: 'On 8 September 1969, Jamaica switched to the Jamaican dollar (JMD), divided into 100 cents. Initial notes featured Queen Elizabeth II and national figures.' },
    { heading: 'Current series', text: 'Modern banknotes honour National Heroes (e.g. Marcus Garvey, Nanny, Paul Bogle, George William Gordon, Norman Manley, Bustamante, Sam Sharpe) and other icons. Coins include the dollar and smaller denominations.' },
  ],
  links: [
    { label: 'Wikipedia – Jamaican dollar', url: 'https://en.wikipedia.org/wiki/Jamaican_dollar' },
    { label: 'Bank of Jamaica', url: 'https://www.boj.org.jm/' },
  ],
};

export const BRITISH_RULE = {
  title: 'British Rule',
  intro: 'Jamaica came under English control in 1655 when the British captured the island from Spain. For over 300 years it remained a British colony, central to the Atlantic sugar and slave economy.',
  points: [
    'Spanish colonizers (1494–1655) were displaced by the English; the island became a Crown colony.',
    'Sugar plantations dominated; enslaved Africans provided the labour that made Jamaica one of Britain\'s most valuable colonies.',
    'After emancipation (1834–38), indentured labour from India and China was introduced.',
    'Crown Colony government meant power rested with London until the 20th century.',
    'Movements for self-government grew; universal adult suffrage came in 1944, and Jamaica gained independence on August 6, 1962.',
  ],
  links: [
    { label: 'Wikipedia – History of Jamaica', url: 'https://en.wikipedia.org/wiki/History_of_Jamaica' },
    { label: 'JIS – History', url: 'https://jis.gov.jm/information/history/' },
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
  links: [
    { label: 'Wikipedia – Taíno', url: 'https://en.wikipedia.org/wiki/Ta%C3%ADno' },
    { label: 'Wikipedia – Indigenous people of Jamaica', url: 'https://en.wikipedia.org/wiki/Indigenous_people_of_Jamaica' },
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
  links: [
    { label: 'Wikipedia – Christopher Columbus', url: 'https://en.wikipedia.org/wiki/Christopher_Columbus' },
    { label: 'Wikipedia – Spanish Jamaica', url: 'https://en.wikipedia.org/wiki/Colony_of_Santiago' },
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
  links: [
    { label: 'Wikipedia – Slavery in Jamaica', url: 'https://en.wikipedia.org/wiki/Slavery_in_Jamaica' },
    { label: 'Wikipedia – Christmas Rebellion', url: 'https://en.wikipedia.org/wiki/Baptist_War' },
  ],
};

export const MUSEUMS: Array<{
  name: string;
  location: string;
  description: string;
  links: ExternalLink[];
}> = [
  {
    name: 'Bob Marley Museum',
    location: '56 Hope Rd, Kingston',
    description: 'The former home and studio of Bob Marley. Exhibits, memorabilia, and his legacy in reggae and Rastafari. A major cultural destination for visitors to Kingston.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bob_Marley_Museum' },
      { label: 'Bob Marley Museum official', url: 'https://www.bobmarleymuseum.com/' },
    ],
  },
  {
    name: 'National Museum of Jamaica',
    location: 'Spanish Town / Kingston (Institute of Jamaica)',
    description: 'Holds collections on Jamaican history, Taíno artefacts, slavery, and cultural heritage. The island\'s principal museum of history and culture.',
    links: [
      { label: 'Wikipedia – Institute of Jamaica', url: 'https://en.wikipedia.org/wiki/Institute_of_Jamaica' },
      { label: 'National Library of Jamaica', url: 'https://www.nlj.gov.jm/' },
    ],
  },
  {
    name: 'Port Royal Maritime Museum',
    location: 'Port Royal',
    description: 'Showcases the maritime and pirate history of Port Royal and the 1692 earthquake. Part of the historic Port Royal heritage area.',
    links: [
      { label: 'Jamaica National Heritage Trust', url: 'http://www.jnht.com/site_port_royal.php' },
    ],
  },
  {
    name: 'Jamaica Music Museum',
    location: 'Kingston',
    description: 'Dedicated to Jamaica\'s music history: ska, rocksteady, reggae, dancehall, and the artists who shaped them.',
    links: [
      { label: 'Wikipedia – Music of Jamaica', url: 'https://en.wikipedia.org/wiki/Music_of_Jamaica' },
    ],
  },
];

export const PERSONS_LIKE_MS_LOU: Array<{
  name: string;
  role: string;
  blurb: string;
  links: ExternalLink[];
}> = [
  {
    name: 'Louise Bennett-Coverley (Miss Lou)',
    role: 'Poet, folklorist, performer',
    blurb: 'Brought Jamaican Patois to the stage and radio; celebrated Jamaican language and culture. "Manners out-rule money." A beloved voice of Jamaican identity and humour.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Louise_Bennett-Coverley' },
      { label: 'JIS – Miss Lou', url: 'https://jis.gov.jm/information/get-the-facts/louise-bennett-coverley-miss-lou/' },
    ],
  },
  {
    name: 'Bob Marley',
    role: 'Musician & global icon',
    blurb: 'Spread reggae and messages of peace, love, and resistance worldwide. One of the greatest musicians of the 20th century; his music and Rastafari influence remain global.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bob_Marley' },
      { label: 'Bob Marley Museum', url: 'https://www.bobmarleymuseum.com/' },
    ],
  },
  {
    name: 'Usain Bolt',
    role: 'Sprinter',
    blurb: 'Eight-time Olympic gold medallist; "the fastest man alive." World records in 100 m and 200 m. Put Jamaica on the map in athletics and inspired a generation of sprinters.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Usain_Bolt' },
      { label: 'World Athletics', url: 'https://worldathletics.org/athletes/jamaica/usain-bolt-14201847' },
    ],
  },
  {
    name: 'Shelly-Ann Fraser-Pryce',
    role: 'Sprinter',
    blurb: 'Multiple Olympic and World Championship gold medallist; one of the greatest female sprinters ever. Nicknamed "Pocket Rocket."',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Shelly-Ann_Fraser-Pryce' },
      { label: 'World Athletics', url: 'https://worldathletics.org/athletes/jamaica/shelly-ann-fraser-pryce-14293236' },
    ],
  },
  {
    name: 'Veronica Campbell-Brown',
    role: 'Sprinter',
    blurb: 'Three-time Olympic gold medallist (200 m, 4×100 m). One of Jamaica\'s most decorated athletes and a pioneer for Caribbean sprinting.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Veronica_Campbell-Brown' },
    ],
  },
  {
    name: 'Elaine Thompson-Herah',
    role: 'Sprinter',
    blurb: 'Olympic champion in 100 m and 200 m (2016, 2020). One of the fastest women in history and a key part of Jamaica\'s sprint dominance.',
    links: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Elaine_Thompson-Herah' },
    ],
  },
];

export const JAMAICAN_CUISINE = [
  { name: 'Ackee and Saltfish', description: 'Jamaica\'s national dish. Ackee (fruit) cooked with salted cod, onions, tomatoes, and spices, often with fried dumplings or boiled green bananas.' },
  { name: 'Jerk', description: 'Meat or fish marinated with jerk spice (allspice, scotch bonnet, thyme, etc.) and slow-cooked over pimento wood. Originated with the Maroons.' },
  { name: 'Curry Goat', description: 'Goat meat in a rich curry sauce, often served with rice and peas — a staple at celebrations.' },
  { name: 'Rice and Peas', description: 'Rice cooked with coconut milk and kidney beans (or gungo peas), often served with Sunday dinner.' },
  { name: 'Bammy', description: 'Flatbread made from cassava; a Taíno legacy, often eaten with fish.' },
  { name: 'Escovitch Fish', description: 'Fried fish topped with a spicy vinegar-based sauce with carrots and peppers.' },
];

export const NATIONAL_SYMBOLS: Array<{
  name: string;
  value: string;
  description?: string;
  links: ExternalLink[];
}> = [
  { name: 'National dish', value: 'Ackee and Saltfish', description: 'Ackee (fruit) with salted cod and seasonings; often served with dumplings or green banana.', links: [{ label: 'Wikipedia – Ackee and saltfish', url: 'https://en.wikipedia.org/wiki/Ackee_and_saltfish' }] },
  { name: 'National fruit', value: 'Ackee', description: 'Bright red fruit native to West Africa; when ripe, the yellow arils are cooked as a staple.', links: [{ label: 'Wikipedia – Ackee', url: 'https://en.wikipedia.org/wiki/Ackee' }] },
  { name: 'National bird', value: 'Doctor Bird (Red-billed Streamertail)', description: 'Endemic hummingbird with long tail streamers; symbol of beauty and resilience.', links: [{ label: 'Wikipedia – Red-billed streamertail', url: 'https://en.wikipedia.org/wiki/Red-billed_streamertail' }] },
  { name: 'National flower', value: 'Lignum Vitae', description: 'Hardwood tree with blue flowers; "wood of life" used in shipbuilding and medicine.', links: [{ label: 'Wikipedia – Lignum vitae', url: 'https://en.wikipedia.org/wiki/Lignum_vitae' }] },
  { name: 'National motto', value: 'Out of Many, One People', description: 'Reflects Jamaica\'s multi-ethnic heritage and unity.', links: [{ label: 'JIS – National Symbols', url: 'https://jis.gov.jm/symbols/' }] },
  { name: 'Flag', value: 'Black, gold, green — diagonal gold cross with black and green triangles', description: 'Black = strength, gold = sunshine, green = land. Adopted 6 August 1962.', links: [{ label: 'Wikipedia – Flag of Jamaica', url: 'https://en.wikipedia.org/wiki/Flag_of_Jamaica' }] },
];

// --- New sections ---

export const PRIME_MINISTERS: Array<{
  name: string;
  party: string;
  term: string;
  links: ExternalLink[];
}> = [
  { name: 'Alexander Bustamante', party: 'JLP', term: '1962–1967', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Alexander_Bustamante' }] },
  { name: 'Donald Sangster', party: 'JLP', term: '1967', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Donald_Sangster' }] },
  { name: 'Hugh Shearer', party: 'JLP', term: '1967–1972', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Hugh_Shearer' }] },
  { name: 'Michael Manley', party: 'PNP', term: '1972–1980', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Michael_Manley' }] },
  { name: 'Edward Seaga', party: 'JLP', term: '1980–1989', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Edward_Seaga' }] },
  { name: 'Michael Manley', party: 'PNP', term: '1989–1992', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Michael_Manley' }] },
  { name: 'P. J. Patterson', party: 'PNP', term: '1992–2006', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/P._J._Patterson' }] },
  { name: 'Portia Simpson-Miller', party: 'PNP', term: '2006–2007, 2012–2016', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Portia_Simpson-Miller' }] },
  { name: 'Bruce Golding', party: 'JLP', term: '2007–2011', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bruce_Golding' }] },
  { name: 'Andrew Holness', party: 'JLP', term: '2011–2012 (acting), 2016–present', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Andrew_Holness' }, { label: 'JIS – Prime Minister', url: 'https://opm.gov.jm/' }] },
];

export const SPORTS_ICONS: Array<{
  name: string;
  sport: string;
  blurb: string;
  links: ExternalLink[];
}> = [
  { name: 'Usain Bolt', sport: 'Athletics', blurb: 'Eight-time Olympic gold medallist; world records in 100 m and 200 m; "the fastest man alive."', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Usain_Bolt' }] },
  { name: 'Shelly-Ann Fraser-Pryce', sport: 'Athletics', blurb: 'Multiple Olympic and World Championship gold medallist; one of the greatest female sprinters.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Shelly-Ann_Fraser-Pryce' }] },
  { name: 'Veronica Campbell-Brown', sport: 'Athletics', blurb: 'Three-time Olympic gold medallist; 200 m and relay legend.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Veronica_Campbell-Brown' }] },
  { name: 'Elaine Thompson-Herah', sport: 'Athletics', blurb: 'Olympic 100 m and 200 m champion (2016, 2020); among the fastest women ever.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Elaine_Thompson-Herah' }] },
  { name: 'Asafa Powell', sport: 'Athletics', blurb: 'Former 100 m world record holder; multiple Olympic and World Championship relay medals.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Asafa_Powell' }] },
  { name: 'Yohan Blake', sport: 'Athletics', blurb: 'Olympic and World Championship medallist; one of the fastest sprinters in history.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Yohan_Blake' }] },
  { name: 'Merlene Ottey', sport: 'Athletics', blurb: 'Nine Olympic medals; competed for Jamaica and later Slovenia; sprint legend.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Merlene_Ottey' }] },
  { name: 'Chris Gayle', sport: 'Cricket', blurb: 'One of the greatest T20 and ODI batsmen; West Indies and Jamaica star.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Chris_Gayle' }] },
  { name: 'Courtney Walsh', sport: 'Cricket', blurb: 'Legendary fast bowler; first to take 500 Test wickets; West Indies great.', links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Courtney_Walsh' }] },
];

export const REGGAE_BOYS_GIRLS: {
  reggaeBoyz: { intro: string; links: ExternalLink[] };
  reggaeGirlz: { intro: string; links: ExternalLink[] };
} = {
  reggaeBoyz: {
    intro: 'The Reggae Boyz are Jamaica\'s national men\'s football team. They made history by qualifying for the 1998 FIFA World Cup in France — the first English-speaking Caribbean nation to do so. The team has won the Caribbean Cup multiple times and regularly competes in the CONCACAF Gold Cup. Home matches are played at Independence Park in Kingston. The team is governed by the Jamaica Football Federation (JFF).',
    links: [
      { label: 'Wikipedia – Jamaica national football team', url: 'https://en.wikipedia.org/wiki/Jamaica_national_football_team' },
      { label: 'Jamaica Football Federation', url: 'https://jff.football/' },
      { label: 'FIFA – Jamaica', url: 'https://www.fifa.com/fifaplus/en/teams/mens/jamaica' },
    ],
  },
  reggaeGirlz: {
    intro: 'The Reggae Girlz are Jamaica\'s national women\'s football team. They made history by qualifying for the 2019 FIFA Women\'s World Cup — the first Caribbean nation to do so — and again for 2023. The team has raised the profile of women\'s football in the region and is a source of national pride.',
    links: [
      { label: 'Wikipedia – Jamaica women\'s national football team', url: 'https://en.wikipedia.org/wiki/Jamaica_women%27s_national_football_team' },
      { label: 'Jamaica Football Federation', url: 'https://jff.football/' },
      { label: 'FIFA – Jamaica Women', url: 'https://www.fifa.com/fifaplus/en/teams/womens/jamaica' },
    ],
  },
};

export const OLYMPIC_MEDALS: {
  intro: string;
  summary: string;
  highlights: string[];
  links: ExternalLink[];
} = {
  intro: 'Jamaica has competed at the Summer Olympics since 1948 (London) and has won nearly all of its medals in athletics, especially sprinting.',
  summary: 'As of the 2024 Paris Games, Jamaica has won 94 Olympic medals in total: 27 gold, 39 silver, and 28 bronze. The country ranks among the top nations in athletics and is famous for producing the world\'s fastest sprinters.',
  highlights: [
    '1948 London: 1 gold, 2 silver (first Olympic medals).',
    '1952 Helsinki: 2 gold, 3 silver.',
    '2008 Beijing: 6 gold, 3 silver, 2 bronze (Usain Bolt\'s breakout Games).',
    '2012 London: 4 gold, 4 silver, 4 bronze.',
    '2016 Rio: 6 gold, 3 silver, 2 bronze.',
    'Notable athletes: Usain Bolt (8 gold), Shelly-Ann Fraser-Pryce, Elaine Thompson-Herah, Veronica Campbell-Brown, and many others.',
  ],
  links: [
    { label: 'Wikipedia – Jamaica at the Olympics', url: 'https://en.wikipedia.org/wiki/Jamaica_at_the_Olympics' },
    { label: 'Olympics.com – Jamaica', url: 'https://olympics.com/en/olympic-games/paris-2024/medals?country=jamaica' },
  ],
};
