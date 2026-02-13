/**
 * Gear AI CoPilot - Firebase Authentication Configuration
 * 
 * Initializes Firebase Auth client using environment variables
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

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: process.env.FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId,
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
    return false;
  }
  return true;
};

// Check if we have valid configuration
const hasValidConfig = validateConfig();

// Initialize Firebase App
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

// Only initialize Firebase if we have valid configuration
if (hasValidConfig) {
  try {
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
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    // Set to null on error to prevent app crashes
    firebaseApp = null;
    auth = null;
  }
} else {
  console.warn('⚠️  Firebase not initialized due to missing configuration. Authentication features will be disabled.');
}

export { firebaseApp, auth };
export default firebaseApp;
