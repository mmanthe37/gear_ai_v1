/**
 * Gear AI CoPilot - Firebase Authentication Configuration
 * 
 * Initializes Firebase Auth client using environment variables
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence,
  Auth
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
  }
};

// Initialize Firebase App
let firebaseApp: FirebaseApp;
let auth: Auth;

try {
  validateConfig();
  
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } else {
    firebaseApp = getApps()[0];
    console.log('✅ Firebase already initialized');
  }

  // Initialize Auth with React Native persistence
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If auth is already initialized, just get it
    auth = getAuth(firebaseApp);
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Initialize with default app to prevent crashes
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
  auth = getAuth(firebaseApp);
}

export { firebaseApp, auth };
export default firebaseApp;
