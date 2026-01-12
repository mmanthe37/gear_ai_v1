# Authentication System Documentation

## Overview
This document describes the authentication system implemented for Gear AI CoPilot MVP. The system uses Firebase Authentication for user management and automatically syncs user data to a Supabase PostgreSQL database.

## Architecture

### Components

1. **Firebase Authentication** (`lib/firebase.ts`)
   - Handles user registration and login
   - Email/password authentication
   - Platform-aware session persistence
   - Environment-based configuration

2. **Supabase Client** (`lib/supabase.ts`)
   - Database connection for user data
   - Automatic session management
   - Row Level Security (RLS) ready

3. **Auth Service** (`services/auth-service.ts`)
   - User synchronization between Firebase and Supabase
   - Automatic user creation on registration
   - Last login tracking
   - Error handling and retry logic

4. **Auth Context** (`contexts/AuthContext.tsx`)
   - Global authentication state
   - React hooks for auth access
   - Loading states
   - Automatic auth state persistence

5. **Login UI** (`app/login.tsx`)
   - Liquid Glass design system
   - Sign in and sign up forms
   - Responsive and accessible
   - Error handling with user feedback

## Setup

### 1. Environment Variables

Copy `.env.local` and configure with your credentials:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Email/Password authentication
3. Copy credentials to `.env.local`

### 3. Supabase Setup

1. Create a Supabase project at [Supabase Dashboard](https://app.supabase.com)
2. Run the migrations in `supabase/migrations/`:
   ```bash
   supabase db push
   ```
3. Copy credentials to `.env.local`

### 4. Database Schema

The system creates users in the `public.users` table with the following structure:

```sql
CREATE TABLE public.users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  tier VARCHAR(20) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'none',
  subscription_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  preferences JSONB DEFAULT '{}'::jsonb
);
```

## Usage

### Sign Up

```typescript
import { useAuth } from '../contexts/AuthContext';

function SignUpComponent() {
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    try {
      await signUp({
        email: 'user@example.com',
        password: 'securePassword123',
        display_name: 'John Doe' // optional
      });
      // User is automatically redirected
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };
}
```

### Sign In

```typescript
import { useAuth } from '../contexts/AuthContext';

function SignInComponent() {
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn({
        email: 'user@example.com',
        password: 'securePassword123'
      });
      // User is automatically redirected
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };
}
```

### Access User Data

```typescript
import { useAuth } from '../contexts/AuthContext';

function ProfileComponent() {
  const { user, firebaseUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      <Text>Email: {user?.email}</Text>
      <Text>Name: {user?.display_name}</Text>
      <Text>Tier: {user?.tier}</Text>
      <Text>Firebase UID: {firebaseUser?.uid}</Text>
    </View>
  );
}
```

### Sign Out

```typescript
import { useAuth } from '../contexts/AuthContext';

function SignOutButton() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // User is automatically redirected to login
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return <Button onPress={handleSignOut}>Sign Out</Button>;
}
```

### Protected Routes

The app automatically protects routes using the auth state:

```typescript
// app/index.tsx
export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
```

## User Flow

1. **New User Registration:**
   - User fills signup form
   - Firebase creates authentication record
   - Service syncs user to Supabase `users` table
   - User is logged in and redirected to app

2. **Existing User Login:**
   - User fills signin form
   - Firebase authenticates user
   - Service updates `last_login_at` in Supabase
   - User is logged in and redirected to app

3. **Session Persistence:**
   - Web: Browser local storage
   - Native: Automatic with Firebase SDK
   - Session is restored on app restart

4. **Sign Out:**
   - Firebase session cleared
   - Local state reset
   - User redirected to login

## Security Features

1. **Password Requirements:**
   - Minimum 6 characters (Firebase default)
   - Can be customized in Firebase Console

2. **Email Verification:**
   - Optional (can be enabled in Firebase Console)
   - Recommended for production

3. **Row Level Security:**
   - Supabase RLS policies defined in migrations
   - Users can only access their own data

4. **Environment Variables:**
   - Credentials stored in `.env.local`
   - Not committed to version control
   - Separate configs for dev/production

## Error Handling

The system includes comprehensive error handling:

- **Network Errors:** Automatic retry with exponential backoff
- **Invalid Credentials:** User-friendly error messages
- **Database Sync Failures:** Logged but don't block authentication
- **Missing Config:** Warnings in console with graceful degradation

## Testing

To test the authentication system:

1. Configure `.env.local` with valid credentials
2. Start development server:
   ```bash
   npm start
   ```
3. Navigate to `/login`
4. Test sign up flow
5. Verify user creation in Supabase dashboard
6. Test sign in flow
7. Test sign out
8. Verify session persistence

## Troubleshooting

### Firebase initialization errors
- Check `.env.local` has all Firebase credentials
- Verify Firebase project is active
- Check Firebase Console for authentication status

### Supabase sync failures
- Verify Supabase credentials in `.env.local`
- Check database migrations are applied
- Verify RLS policies allow inserts
- Check Supabase logs in dashboard

### Login redirects not working
- Clear browser cache/storage
- Check router configuration
- Verify AuthProvider wraps entire app

## Next Steps

1. **Email Verification:** Enable in Firebase Console
2. **Password Reset:** Implement forgot password flow
3. **Social Auth:** Add Google, Apple sign in
4. **Two-Factor Auth:** Add SMS or TOTP
5. **Session Management:** Add device tracking
6. **Audit Logging:** Track all auth events

## Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Context API](https://react.dev/reference/react/useContext)
