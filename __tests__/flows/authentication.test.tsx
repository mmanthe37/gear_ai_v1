/**
 * Integration Test - Authentication Flow
 * 
 * Tests complete signup, login, and logout flows
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { render } from '../utils/test-utils';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/auth-service';
import { mockFirebaseUser, mockUser } from '../utils/mock-data';
import { onAuthStateChanged } from 'firebase/auth';

// Mock auth service
jest.mock('../../services/auth-service');
jest.mock('firebase/auth');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;

// Test component to access auth context
function TestComponent() {
  const { user, firebaseUser, loading, signIn, signUp, signOut } = useAuth();
  
  return null; // We're just testing the context logic
}

describe('Authentication Flow Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sign Up Flow', () => {
    it('should complete signup flow successfully', async () => {
      // Arrange
      mockAuthService.signUp.mockResolvedValue({
        firebaseUser: mockFirebaseUser as any,
        user: mockUser,
      });

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate Firebase auth state change
        callback(mockFirebaseUser as any);
        return jest.fn(); // unsubscribe function
      });

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Perform signup
      await result.current.signUp({
        email: 'newuser@example.com',
        password: 'password123',
        display_name: 'New User',
      });

      // Assert
      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          display_name: 'New User',
        });
      });
    });

    it('should handle signup errors', async () => {
      // Arrange
      mockAuthService.signUp.mockRejectedValue(new Error('Email already in use'));

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return jest.fn();
      });

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      await expect(
        result.current.signUp({
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('Sign In Flow', () => {
    it('should complete login flow successfully', async () => {
      // Arrange
      mockAuthService.signIn.mockResolvedValue({
        firebaseUser: mockFirebaseUser as any,
        user: mockUser,
      });

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockFirebaseUser as any);
        return jest.fn();
      });

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert
      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should handle login errors', async () => {
      // Arrange
      mockAuthService.signIn.mockRejectedValue(new Error('Invalid credentials'));

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      await expect(
        result.current.signIn({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Sign Out Flow', () => {
    it('should complete logout flow successfully', async () => {
      // Arrange
      mockAuthService.signOut.mockResolvedValue(undefined);

      let authCallback: any;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        callback(mockFirebaseUser as any); // Start logged in
        return jest.fn();
      });

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signOut();

      // Simulate Firebase auth state change after signout
      if (authCallback) {
        authCallback(null);
      }

      // Assert
      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(result.current.firebaseUser).toBeNull();
      });
    });
  });

  describe('Auth State Persistence', () => {
    it('should restore user session on app restart', async () => {
      // Arrange
      mockAuthService.syncUserToSupabase.mockResolvedValue(mockUser);

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate existing Firebase session
        callback(mockFirebaseUser as any);
        return jest.fn();
      });

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.firebaseUser).toBeDefined();
        expect(result.current.user).toBeDefined();
      });
    });
  });
});

// Helper function to render hooks (simplified version)
function renderHook<T>(hook: () => T, options?: { wrapper: React.ComponentType<any> }) {
  let result: { current: T } = { current: undefined as any };
  
  function TestHook() {
    result.current = hook();
    return null;
  }

  const Wrapper = options?.wrapper || React.Fragment;
  render(
    <Wrapper>
      <TestHook />
    </Wrapper>
  );

  return { result };
}
