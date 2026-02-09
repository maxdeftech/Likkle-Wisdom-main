
export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  isGuest: boolean;
  isPremium: boolean;
}

export interface Quote {
  id: string;
  patois: string;
  english: string;
  category: string;
  isFavorite: boolean;
  date?: string;
  updatedAt?: number;
}

export interface IconicQuote {
  id: string;
  author: string;
  text: string;
  category: 'Legends';
  isFavorite: boolean;
}

export interface BibleAffirmation {
  id: string;
  reference: string;
  kjv: string;
  patois: string;
  category: 'Word & Powah';
  isFavorite: boolean;
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  text: string;
  mood: string;
  timestamp: number;
}

export type View = 'splash' | 'onboarding' | 'auth' | 'main' | 'privacy' | 'terms';
export type Tab = 'home' | 'discover' | 'bible' | 'book' | 'me';
export type Mood = 'Peace' | 'Hustle' | 'Joy' | 'Healing';
