/**
 * Tests for Authentication Service
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import * as authService from '../../services/auth-service';
import { supabase } from '../../lib/supabase';
import { mockFirebaseUser, mockUser } from '../utils/mock-data';

// Mock the modules
jest.mock('firebase/auth');
jest.mock('../../lib/supabase');
jest.mock('../../lib/firebase', () => ({
  auth: { currentUser: null },
}));

const mockCreateUser = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignIn = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockSignOut = firebaseSignOut as jest.MockedFunction<typeof firebaseSignOut>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      // Arrange - Don't provide display_name to avoid dynamic import
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockCreateUser.mockResolvedValue({
        user: mockFirebaseUser as any,
      } as any);

      // Mock supabase calls for user creation
      const mockSupabaseFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      });

      (supabase.from as jest.Mock) = mockSupabaseFrom;

      // Act
      const result = await authService.signUp(signUpData);

      // Assert
      expect(mockCreateUser).toHaveBeenCalled();
      expect(result.firebaseUser).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const signUpData = {
        email: 'invalid-email',
        password: 'password123',
      };

      mockCreateUser.mockRejectedValue(new Error('Invalid email format'));

      // Act & Assert
      await expect(authService.signUp(signUpData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const signUpData = {
        email: 'test@example.com',
        password: '123',
      };

      mockCreateUser.mockRejectedValue(new Error('Password should be at least 6 characters'));

      // Act & Assert
      await expect(authService.signUp(signUpData)).rejects.toThrow();
    });
  });

  describe('signIn', () => {
    it('should successfully sign in an existing user', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockSignIn.mockResolvedValue({
        user: mockFirebaseUser as any,
      } as any);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        update: jest.fn().mockReturnThis(),
      });

      // Act
      const result = await authService.signIn(credentials);

      // Assert
      expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), credentials.email, credentials.password);
      expect(result.firebaseUser).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should throw error for wrong password', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockSignIn.mockRejectedValue(new Error('Wrong password'));

      // Act & Assert
      await expect(authService.signIn(credentials)).rejects.toThrow('Wrong password');
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockSignIn.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(authService.signIn(credentials)).rejects.toThrow('User not found');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      // Arrange
      mockSignOut.mockResolvedValue(undefined);

      // Act
      await authService.signOut();

      // Assert
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      // Arrange
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      // Act & Assert
      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('syncUserToSupabase', () => {
    it('should create new user in Supabase if not exists', async () => {
      // Arrange
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        insert: jest.fn().mockReturnThis(),
      });

      (supabase.from('users').insert as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      });

      // Act
      const result = await authService.syncUserToSupabase(mockFirebaseUser as any);

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockFirebaseUser.email);
    });

    it('should update existing user last login', async () => {
      // Arrange
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        update: jest.fn().mockReturnThis(),
      });

      (supabase.from('users').update as jest.Mock).mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...mockUser, last_login_at: new Date().toISOString() }, error: null }),
      });

      // Act
      const result = await authService.syncUserToSupabase(mockFirebaseUser as any);

      // Assert
      expect(result).toBeDefined();
      expect(result?.firebase_uid).toBe(mockFirebaseUser.uid);
    });
  });

  describe('getUserByFirebaseUid', () => {
    it('should return user when found', async () => {
      // Arrange
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      });

      // Act
      const result = await authService.getUserByFirebaseUid('test-firebase-uid-123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.firebase_uid).toBe('test-firebase-uid-123');
    });

    it('should return null when user not found', async () => {
      // Arrange
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      });

      // Act
      const result = await authService.getUserByFirebaseUid('non-existent-uid');

      // Assert
      expect(result).toBeNull();
    });
  });
});
