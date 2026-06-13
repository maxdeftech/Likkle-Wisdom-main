/**
 * src/services/supabase.ts — Supabase client for Auth, Postgres, and Realtime.
 * If env vars are missing or invalid, client is null and backend features are disabled.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Safely read Vite env vars. Client builds should provide VITE_SUPABASE_URL
 * and VITE_SUPABASE_ANON_KEY through the deployment environment.
 */
const getEnv = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteKey = `VITE_${key}`;
      if ((import.meta as any).env[viteKey]) return (import.meta as any).env[viteKey];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Only create client when URL looks valid and key is present
const isValid = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey;

export const supabase = isValid ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.warn('Supabase client could not be initialized. Backend features will be disabled.');
}
