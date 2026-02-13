/**
 * Gear AI CoPilot - Supabase Client Configuration
 * 
 * Initializes Supabase client for database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

// Validate configuration
const hasValidConfig = supabaseUrl && supabaseAnonKey;

if (!hasValidConfig) {
  console.warn(
    'Supabase configuration incomplete.\n' +
    'Please ensure .env.local contains SUPABASE_URL and SUPABASE_ANON_KEY.'
  );
}

// Create Supabase client only if we have valid configuration
// Export null if config is missing to prevent confusing runtime errors
export const supabase: SupabaseClient | null = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export default supabase;
