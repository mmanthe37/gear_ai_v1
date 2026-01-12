/**
 * Gear AI CoPilot - Authentication Service
 * 
 * Handles Firebase Authentication and syncs user data with Supabase
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { User, SignUpData, AuthCredentials } from '../types/user';

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

    // Sync to Supabase
    const supabaseUser = await syncUserToSupabase(firebaseUser);

    return { firebaseUser, user: supabaseUser };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Failed to sign up');
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

    return { firebaseUser, user: supabaseUser };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log('✅ User signed out');
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
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
