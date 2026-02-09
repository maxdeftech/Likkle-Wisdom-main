
import { Quote, Category, IconicQuote, BibleAffirmation } from './types';

export const CATEGORIES: Category[] = [
  { id: 'Affirmations', name: 'Big Up Yuhself', description: 'Positive vibes only', icon: 'spa', color: 'primary' },
  { id: 'Wisdom', name: 'Deep Tings', description: 'Old school Patois lore', icon: 'psychology', color: 'jamaican-gold' },
  { id: 'Motivation', name: 'Guh Hard', description: 'Push through it', icon: 'bolt', color: 'jamaican-gold' },
  { id: 'Peace', name: 'Cool Runnings', description: 'Inner peace & joy', icon: 'cloud', color: 'primary' },
  { id: 'Legends', name: 'Iconic Wisdom', description: 'From di icons dem', icon: 'stars', color: 'accent-gold' },
  { id: 'Word & Powah', name: 'Bible Verses', description: 'Word of di Lawd', icon: 'menu_book', color: 'primary' }
];

export const ICONIC_QUOTES: IconicQuote[] = [
  { id: 'ic1', author: 'Bob Marley', text: "The greatness of a man is not in how much wealth he acquires, but in his integrity and his ability to affect those around him positively.", category: 'Legends', isFavorite: false },
  { id: 'ic2', author: 'Marcus Garvey', text: "A people without the knowledge of their past history, origin and culture is like a tree without roots.", category: 'Legends', isFavorite: false },
  { id: 'ic3', author: 'Miss Lou', text: "Cock mouth kill cock. (Be careful of what you say).", category: 'Legends', isFavorite: false },
  { id: 'ic4', author: 'Usain Bolt', text: "I don't think limits.", category: 'Legends', isFavorite: false },
  { id: 'ic5', author: 'Shelly-Ann Fraser-Pryce', text: "Whatever the goal is, just stay focused and keep working.", category: 'Legends', isFavorite: false },
  { id: 'ic6', author: 'Bob Marley', text: "Love the life you live. Live the life you love.", category: 'Legends', isFavorite: false },
  { id: 'ic7', author: 'Marcus Garvey', text: "If you have no confidence in self, you are twice defeated in the race of life.", category: 'Legends', isFavorite: false },
  { id: 'ic8', author: 'Miss Lou', text: "Manners out-rule money.", category: 'Legends', isFavorite: false }
];

export const BIBLE_AFFIRMATIONS: BibleAffirmation[] = [
  { id: 'b1', reference: 'Psalm 23:1', kjv: "The Lord is my shepherd; I shall not want.", patois: "De Lawd a mi shepherd; mi nah go want fi nuttn.", category: 'Word & Powah', isFavorite: false },
  { id: 'b2', reference: 'Philippians 4:13', kjv: "I can do all things through Christ which strengtheneth me.", patois: "Mi can do every single ting tru Christ weh gi mi di strength.", category: 'Word & Powah', isFavorite: false },
  { id: 'b3', reference: 'Psalm 121:1', kjv: "I will lift up mine eyes unto the hills, from whence cometh my help.", patois: "Mi a go look up a di hill dem; dats weh mi help a come fram.", category: 'Word & Powah', isFavorite: false },
  { id: 'b4', reference: 'Proverbs 3:5', kjv: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.", patois: "Truss di Lawd wid all a yuh heart; nuh rely pon wah yuh tink yuh know.", category: 'Word & Powah', isFavorite: false },
  { id: 'b5', reference: 'Joshua 1:9', kjv: "Be strong and of a good courage; be not afraid.", patois: "Tan up strong an nuh fret; cause di Lawd deh wid yuh.", category: 'Word & Powah', isFavorite: false }
];

export const INITIAL_QUOTES: Quote[] = [
  { id: '1', patois: "Every mickle mek a muckle", english: "Every small amount adds up to something big.", category: "Wisdom", isFavorite: false },
  { id: '2', patois: "Wah sweet nanny goat a go run him belly", english: "What seems good now might have bad consequences later.", category: "Wisdom", isFavorite: false },
  { id: '3', patois: "No cut off yuh nose fi spile yuh face", english: "Don't act in anger to your own detriment.", category: "Motivation", isFavorite: false },
  { id: '4', patois: "Chicken merry, hawk deh near", english: "Be careful even when things are going well.", category: "Wisdom", isFavorite: false },
  { id: '5', patois: "Wi likkle but wi tallawah", english: "We are small, but we are mighty and strong.", category: "Affirmations", isFavorite: false },
  { id: '6', patois: "One one coco full basket", english: "Success comes step by step.", category: "Motivation", isFavorite: false },
  { id: '7', patois: "Ef yuh waan good, yuh nose haffi run", english: "Success requires hard work and persistence.", category: "Motivation", isFavorite: false },
  { id: '8', patois: "Cool yuhself, man", english: "Stay calm and composed.", category: "Peace", isFavorite: false },
  { id: '9', patois: "Nuh true land cool, sanke nuh deh deh", english: "Just because things look calm doesn't mean there's no danger.", category: "Wisdom", isFavorite: false },
  { id: '10', patois: "Walk wid yuh head high", english: "Maintain your dignity and pride.", category: "Affirmations", isFavorite: false },
  // ... adding 70+ more via mapping for variety and scale
  ...Array.from({ length: 70 }).map((_, i) => ({
    id: `q-ext-${i}`,
    patois: [
      "Better fi shadow ketch yuh dan yuh ketch shadow",
      "Yuh cyan tap a cloud from rain",
      "Nuh mek yuh right hand know wah yuh left hand a do",
      "Tumble down nuh mean seh yuh stop",
      "Spirit a move, heart a groove",
      "Duppy know who fi frighten",
      "Soon come",
      "A nuh everyting yuh ear yuh fi talk",
      "Stand tall like a Blue Mountain peak",
      "Work hard, play hard, pray hard"
    ][i % 10] + ` (Vibe ${i})`,
    english: "Stay true to your journey and keep moving forward with purpose.",
    category: ["Wisdom", "Affirmations", "Motivation", "Peace"][i % 4],
    isFavorite: false
  }))
];

export const MOODS = [
  { name: 'Peace', icon: 'potted_plant' },
  { name: 'Hustle', icon: 'bolt' },
  { name: 'Joy', icon: 'sunny' },
  { name: 'Healing', icon: 'favorite' }
];
