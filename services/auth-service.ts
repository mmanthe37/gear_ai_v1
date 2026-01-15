/**
 * Gear AI CoPilot - Authentication Service
 * 
 * Handles Firebase Authentication and syncs user data with Supabase
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
  AuthError,
  AuthErrorCodes
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { User, SignUpData, AuthCredentials } from '../types/user';

// Storage keys
const AUTH_TOKEN_KEY = '@gear_ai_auth_token';
const USER_DATA_KEY = '@gear_ai_user_data';

/**
 * Parse Firebase Auth error and return user-friendly message
 */
export function getAuthErrorMessage(error: any): string {
  if (!error || !error.code) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorCode = error.code as string;
  
  switch (errorCode) {
    case AuthErrorCodes.EMAIL_EXISTS:
      return 'This email is already registered. Please sign in instead.';
    case AuthErrorCodes.INVALID_EMAIL:
      return 'Invalid email address. Please check and try again.';
    case AuthErrorCodes.WEAK_PASSWORD:
      return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers.';
    case AuthErrorCodes.USER_DELETED:
      return 'No account found with this email. Please sign up.';
    case AuthErrorCodes.INVALID_PASSWORD:
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
      return 'Too many failed attempts. Please try again later.';
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
      return 'Network error. Please check your connection and try again.';
    case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case AuthErrorCodes.USER_DISABLED:
      return 'This account has been disabled. Please contact support.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Create or update user record in Supabase when Firebase user is created/authenticated
 */
export async function syncUserToSupabase(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUser.uid)
      .single();

    if (existingUser && !fetchError) {
      // Update last login
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('firebase_uid', firebaseUser.uid)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user login time:', updateError);
        return existingUser;
      }

      return updatedUser;
    }

    // Create new user in Supabase
    const newUser = {
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      display_name: firebaseUser.displayName || undefined,
      avatar_url: firebaseUser.photoURL || undefined,
      tier: 'free' as const,
      subscription_status: 'none' as const,
      last_login_at: new Date().toISOString(),
      preferences: {},
    };

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (createError) {
      console.error('Error creating user in Supabase:', createError);
      throw createError;
    }

    console.log('✅ User synced to Supabase:', createdUser);
    return createdUser;
  } catch (error) {
    console.error('Error syncing user to Supabase:', error);
    return null;
  }
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(signUpData: SignUpData): Promise<{ firebaseUser: FirebaseUser; user: User | null }> {
  try {
    const { email, password, display_name } = signUpData;
    
    // Create user in Firebase
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update display name if provided
    if (display_name) {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(firebaseUser, { displayName: display_name });
    }

    // Sync to Supabase
    const supabaseUser = await syncUserToSupabase(firebaseUser);

    // Store auth token
    await storeAuthToken(await firebaseUser.getIdToken());

    return { firebaseUser, user: supabaseUser };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(getAuthErrorMessage(error));
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(credentials: AuthCredentials): Promise<{ firebaseUser: FirebaseUser; user: User | null }> {
  try {
    const { email, password } = credentials;
    
    // Sign in with Firebase
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Sync to Supabase (updates last_login_at)
    const supabaseUser = await syncUserToSupabase(firebaseUser);

    // Store auth token
    await storeAuthToken(await firebaseUser.getIdToken());

    return { firebaseUser, user: supabaseUser };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(getAuthErrorMessage(error));
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    await clearAuthData();
    console.log('✅ User signed out');
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(getAuthErrorMessage(error));
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error));
  }
}

/**
 * Store auth token in AsyncStorage
 */
async function storeAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
}

/**
 * Get stored auth token from AsyncStorage
 */
export async function getStoredAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored auth token:', error);
    return null;
  }
}

/**
 * Store user data in AsyncStorage
 */
export async function storeUserData(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
}

/**
 * Get stored user data from AsyncStorage
 */
export async function getStoredUserData(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting stored user data:', error);
    return null;
  }
}

/**
 * Clear all auth data from AsyncStorage
 */
async function clearAuthData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

/**
 * Get user data from Supabase by Firebase UID
 */
export async function getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error) {
      console.error('Error fetching user from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByFirebaseUid:', error);
    return null;
  }
}
