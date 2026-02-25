/**
 * Gear AI CoPilot - Firebase Authentication Configuration
 * 
 * Initializes Firebase Auth client using environment variables
 * Supports demo mode when credentials are not available
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Check if we're in demo mode (no credentials provided)
const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true' || 
                 (!process.env.FIREBASE_API_KEY && !Constants.expoConfig?.extra?.firebaseApiKey);

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey || 'demo-api-key',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.firebaseAuthDomain || 'demo.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.firebaseProjectId || 'demo-project',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.firebaseStorageBucket || 'demo.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.firebaseMessagingSenderId || '123456789',
  appId: process.env.FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId || '1:123456789:web:abc123',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || Constants.expoConfig?.extra?.firebaseMeasurementId,
};

// Validate configuration
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    console.warn(
      `Firebase configuration incomplete. Missing: ${missing.join(', ')}\n` +
      'Please ensure .env.local is properly configured with Firebase credentials.'
    );
  }
  
  if (DEMO_MODE) {
    console.warn(
      '🚧 Running in DEMO MODE - Firebase authentication is disabled.\n' +
      'Using mock data for demonstration purposes.'
    );
  }
};

// Initialize Firebase App
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  validateConfig();
  
  // Only initialize Firebase if not in demo mode
  if (!DEMO_MODE) {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
    } else {
      firebaseApp = getApps()[0];
      console.log('✅ Firebase already initialized');
    }

    // Initialize Auth
    auth = getAuth(firebaseApp);
    
    // Set persistence for web platform only
    if (Platform.OS === 'web') {
      setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.warn('Auth persistence setup warning:', error);
      });
    }
  } else {
    console.log('✅ Demo mode active - Firebase initialization skipped');
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization warning:', error);
  console.log('Continuing in demo mode...');
  // In demo mode, we don't need Firebase
  firebaseApp = null;
  auth = null;
}

export { firebaseApp, auth, DEMO_MODE };
export default firebaseApp;
