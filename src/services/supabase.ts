/**
 * src/services/supabase.ts — Supabase client for Auth, Postgres, and Realtime.
 * If env vars are missing or invalid, client is null and backend features are disabled.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Safely read env vars from Vite (import.meta.env) or Node (process.env) to avoid ReferenceErrors.
 * Vite exposes only VITE_* at build time; we look for VITE_SUPABASE_URL etc.
 */
const getEnv = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteKey = `VITE_${key}`;
      if ((import.meta as any).env[viteKey]) return (import.meta as any).env[viteKey];
    }
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

// Project URL and anon key; fallbacks allow app to run without .env in dev
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://sggzlqspglwtaistxfuw.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZ3pscXNwZ2x3dGFpc3R4ZnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQwNjgsImV4cCI6MjA4NjEwMDA2OH0.RPFTQ9g_qS4mmsW27FgH630HuPUzadlrdayALL6o_r0';

// Only create client when URL looks valid and key is present
const isValid = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey;

export const supabase = isValid ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.warn('Supabase client could not be initialized. Backend features will be disabled.');
}
