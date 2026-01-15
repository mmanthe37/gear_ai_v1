/**
 * Gear AI CoPilot - Supabase Client Configuration
 * 
 * Initializes Supabase client for database operations with AsyncStorage persistence
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Database } from '../types/database';

// Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase configuration incomplete.\n' +
    'Please ensure .env.local contains SUPABASE_URL and SUPABASE_ANON_KEY.'
  );
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
