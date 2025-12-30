/**
 * Gear AI CoPilot - User & Subscription Type Definitions
 * 
 * Data models for user accounts and subscription management
 */

export interface User {
  user_id: string;
  firebase_uid: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  tier: SubscriptionTier;
  stripe_customer_id?: string;
  subscription_status: SubscriptionStatus;
  subscription_period_end?: string; // ISO timestamp
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  preferences?: UserPreferences;
}

export type SubscriptionTier = 'free' | 'pro' | 'mechanic' | 'dealer';

export type SubscriptionStatus = 
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'none';

export interface UserPreferences {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  maintenance_reminders?: boolean;
  diagnostic_alerts?: boolean;
  valuation_updates?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  distance_unit?: 'miles' | 'kilometers';
  currency?: string;
  language?: string;
  [key: string]: any;
}

export interface SubscriptionTierFeatures {
  tier: SubscriptionTier;
  name: string;
  price_monthly: number;
  price_yearly?: number;
  features: {
    max_vehicles: number | 'unlimited';
    vin_entry: boolean;
    ocr_vin_scan: boolean;
    manual_access: boolean;
    basic_ai_chat: boolean;
    rag_manual_chat: boolean;
    obd_diagnostics: boolean;
    damage_detection: boolean;
    valuation_tracking: boolean;
    marketplace_tools: boolean;
    web_dashboard: boolean;
    api_access: boolean;
  };
  limits: {
    api_calls_per_hour?: number;
    ai_messages_per_day?: number;
    obd_scans_per_month?: number;
  };
}

export const SubscriptionTiers: Record<SubscriptionTier, SubscriptionTierFeatures> = {
  free: {
    tier: 'free',
    name: 'Free',
    price_monthly: 0,
    features: {
      max_vehicles: 1,
      vin_entry: true,
      ocr_vin_scan: false,
      manual_access: true,
      basic_ai_chat: true,
      rag_manual_chat: false,
      obd_diagnostics: false,
      damage_detection: false,
      valuation_tracking: false,
      marketplace_tools: false,
      web_dashboard: false,
      api_access: false,
    },
    limits: {
      ai_messages_per_day: 10,
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price_monthly: 9.99,
    price_yearly: 99.99,
    features: {
      max_vehicles: 3,
      vin_entry: true,
      ocr_vin_scan: true,
      manual_access: true,
      basic_ai_chat: true,
      rag_manual_chat: true,
      obd_diagnostics: false,
      damage_detection: false,
      valuation_tracking: true,
      marketplace_tools: false,
      web_dashboard: false,
      api_access: false,
    },
    limits: {
      api_calls_per_hour: 100,
      ai_messages_per_day: 100,
    },
  },
  mechanic: {
    tier: 'mechanic',
    name: 'Mechanic',
    price_monthly: 19.99,
    price_yearly: 199.99,
    features: {
      max_vehicles: 'unlimited',
      vin_entry: true,
      ocr_vin_scan: true,
      manual_access: true,
      basic_ai_chat: true,
      rag_manual_chat: true,
      obd_diagnostics: true,
      damage_detection: true,
      valuation_tracking: true,
      marketplace_tools: true,
      web_dashboard: false,
      api_access: false,
    },
    limits: {
      api_calls_per_hour: 500,
      ai_messages_per_day: 500,
      obd_scans_per_month: 100,
    },
  },
  dealer: {
    tier: 'dealer',
    name: 'Dealer/Fleet',
    price_monthly: 99.99,
    features: {
      max_vehicles: 'unlimited',
      vin_entry: true,
      ocr_vin_scan: true,
      manual_access: true,
      basic_ai_chat: true,
      rag_manual_chat: true,
      obd_diagnostics: true,
      damage_detection: true,
      valuation_tracking: true,
      marketplace_tools: true,
      web_dashboard: true,
      api_access: true,
    },
    limits: {
      api_calls_per_hour: 5000,
    },
  },
};

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  display_name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  member_since: string;
  vehicle_count: number;
  total_maintenance_records: number;
}
