/**
 * Gear AI CoPilot - Authentication Context
 * 
 * Manages global authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, AuthCredentials, SignUpData } from '../types/user';
import * as authService from '../services/auth-service';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (signUpData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // User is signed in, fetch/sync Supabase user data
        const supabaseUser = await authService.syncUserToSupabase(fbUser);
        setUser(supabaseUser);
      } else {
        // User is signed out
        setUser(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignIn = async (credentials: AuthCredentials) => {
    try {
      setLoading(true);
      const { firebaseUser: fbUser, user: supabaseUser } = await authService.signIn(credentials);
      setFirebaseUser(fbUser);
      setUser(supabaseUser);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (signUpData: SignUpData) => {
    try {
      setLoading(true);
      const { firebaseUser: fbUser, user: supabaseUser } = await authService.signUp(signUpData);
      setFirebaseUser(fbUser);
      setUser(supabaseUser);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setFirebaseUser(null);
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
