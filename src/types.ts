/**
 * src/types.ts — Shared TypeScript types and interfaces for the Likkle Wisdom app.
 * Used by App, views, and services for type-safe props and API shapes.
 */

/** Logged-in or guest user; isGuest true when continuing without account; isPremium from profiles (optional). */
export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  isGuest: boolean;
  isPremium: boolean;
  isAdmin?: boolean;
  isPublic?: boolean;
}

/** Jamaican Patois quote with English translation and category; isFavorite synced to Supabase bookmarks. */
export interface Quote {
  id: string;
  patois: string;
  english: string;
  category: string;
  isFavorite: boolean;
  date?: string;
  updatedAt?: number;
}

/** Quote from a famous figure (e.g. Bob Marley); category is always 'Legends'. */
export interface IconicQuote {
  id: string;
  author: string;
  text: string;
  category: 'Legends';
  isFavorite: boolean;
}

/** Bible verse with KJV and Patois; category 'Word & Powah'. */
export interface BibleAffirmation {
  id: string;
  reference: string;
  kjv: string;
  patois: string;
  category: 'Word & Powah';
  isFavorite: boolean;
}

/** Raw verse from Bible view (book, chapter, verse, text, reference string). */
export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

/** Category for filtering quotes/iconic/Bible (id, name, description, icon, color). */
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

/** Journal entry in Likkle Book; stored encrypted in Supabase. */
export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  text: string;
  mood: string;
  timestamp: number;
}

/** User-created wisdom (AI or manual) stored in my_wisdom table. */
export interface UserWisdom {
  id: string;
  userId: string;
  patois: string;
  english: string;
  timestamp: number;
}

/** Top-level app view: splash → onboarding → auth → main; privacy/terms are full-screen legal; jamaicanHistory from Discover. */
export type View = 'splash' | 'onboarding' | 'auth' | 'main' | 'privacy' | 'terms' | 'jamaicanHistory';
/** Main tab when view is 'main': home, discover, bible, book (journal), me (profile). */
export type Tab = 'home' | 'discover' | 'bible' | 'book' | 'me';
/** Mood for journal entries and AI wisdom generation. */
export type Mood = 'Peace' | 'Hustle' | 'Joy' | 'Healing';
