
export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  isGuest: boolean;
  isPremium: boolean;
  isAdmin?: boolean;
  isDonor?: boolean;
  isPublic?: boolean;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface Friendship {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  status: 'accepted' | 'blocked';
  since: number;
  lastMessage?: {
    content: string;
    timestamp: number;
    senderId: string;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string; // 'group' or userId
  content: string;
  timestamp: number;
  read: boolean;
  type: 'text' | 'system' | 'admin-broadcast';
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

export interface UserWisdom {
  id: string;
  userId: string;
  patois: string;
  english: string;
  timestamp: number;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  contentType: 'text' | 'image' | 'video' | 'scripture' | 'wisdom';
  textContent?: string;
  mediaUrl?: string;
  scriptureRef?: { book: string; chapter: number; verse: number; text: string };
  wisdomRef?: { patois: string; english: string };
  createdAt: number;
}

export type View = 'splash' | 'onboarding' | 'auth' | 'main' | 'privacy' | 'terms';
export type Tab = 'home' | 'feed' | 'discover' | 'bible' | 'book' | 'me';
export type Mood = 'Peace' | 'Hustle' | 'Joy' | 'Healing';
