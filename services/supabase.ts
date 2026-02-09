
import { createClient } from '@supabase/supabase-js';

// Safely access environment variables to prevent ReferenceErrors
const getEnv = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://sggzlqspglwtaistxfuw.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZ3pscXNwZ2x3dGFpc3R4ZnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQwNjgsImV4cCI6MjA4NjEwMDA2OH0.RPFTQ9g_qS4mmsW27FgH630HuPUzadlrdayALL6o_r0';

// Check if we have valid credentials before initializing
const isValid = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey;

export const supabase = isValid ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.warn('Supabase client could not be initialized. Backend features will be disabled.');
}
