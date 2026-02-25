/**
 * Gear AI CoPilot - Supabase Client Configuration
 * 
 * Initializes Supabase client for database operations
 * Supports demo mode when credentials are not available
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Check if we're in demo mode (no credentials provided)
const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true' || 
                 (!process.env.SUPABASE_URL && !Constants.expoConfig?.extra?.supabaseUrl);

// Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || 'demo-anon-key-placeholder';

// Validate configuration
if (DEMO_MODE) {
  console.warn(
    '🚧 Running in DEMO MODE - Supabase client is using mock configuration.\n' +
    'Database operations will not work. Using mock data for demonstration.'
  );
} else if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://demo.supabase.co') {
  console.warn(
    'Supabase configuration incomplete.\n' +
    'Please ensure .env.local contains SUPABASE_URL and SUPABASE_ANON_KEY.'
  );
}

// Create Supabase client (with demo credentials if needed)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: !DEMO_MODE,
    persistSession: !DEMO_MODE,
    detectSessionInUrl: false,
  },
});

export { DEMO_MODE };
export default supabase;
