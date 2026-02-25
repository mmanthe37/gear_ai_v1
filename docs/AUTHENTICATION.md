# Authentication System Documentation

## Overview
This document describes the complete authentication system implemented for Gear AI CoPilot MVP. The system uses Firebase Authentication for user management, automatically syncs user data to Supabase PostgreSQL database, and includes comprehensive form validation, password reset, and session persistence.

## Key Features

- ✅ Email/password authentication (signup, login, logout)
- ✅ Password reset flow via email
- ✅ Form validation with real-time error display
- ✅ Session persistence with AsyncStorage
- ✅ Auth gate with automatic redirects
- ✅ Liquid Glass design system
- ✅ User-friendly error messages
- ✅ TypeScript strict mode compliance

## Architecture

### Components

1. **Firebase Authentication** (`lib/firebase.ts`)
   - Handles user registration and login
   - Email/password authentication
   - Password reset emails
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
   - Password reset functionality
   - AsyncStorage persistence
   - Enhanced error handling with user-friendly messages
   - Error handling and retry logic

4. **Auth Context** (`contexts/AuthContext.tsx`)
   - Global authentication state
   - React hooks for auth access
   - Loading states
   - Automatic auth state persistence with AsyncStorage
   - User data caching

5. **Form Validation** (`lib/validation.ts`)
   - Email format validation
   - Password strength validation (min 8 chars, 1 uppercase, 1 number)
   - Password confirmation matching
   - Form-level validation helpers

6. **Auth Screens** (`app/auth/`)
   - **Login** (`app/auth/login.tsx`) - Email/password signin with validation
   - **Signup** (`app/auth/signup.tsx`) - Registration with password confirmation
   - **Forgot Password** (`app/auth/forgot-password.tsx`) - Password reset flow
   - All use Liquid Glass design system
   - Responsive and accessible
   - Real-time error handling

7. **Auth Gate** (`app/_layout.tsx`)
   - Automatic route protection
   - Redirects unauthenticated users to `/auth/login`
   - Redirects authenticated users to `/(tabs)`
   - Loading state during auth check

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
        password: 'SecurePass123',  // Min 8 chars, 1 uppercase, 1 number
        display_name: 'John Doe' // optional
      });
      // User is automatically redirected to main app
    } catch (error) {
      // Error message is user-friendly (e.g., "This email is already registered")
      console.error('Sign up failed:', error.message);
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
        password: 'SecurePass123'
      });
      // User is automatically redirected to main app
    } catch (error) {
      // Error message is user-friendly (e.g., "Invalid email or password")
      console.error('Sign in failed:', error.message);
    }
  };
}
```

### Password Reset

```typescript
import { resetPassword } from '../services/auth-service';

async function handleForgotPassword() {
  try {
    await resetPassword('user@example.com');
    // Success! User will receive reset email
    Alert.alert('Success', 'Check your email for reset instructions');
  } catch (error) {
    console.error('Password reset failed:', error.message);
  }
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

The app automatically protects routes using the auth gate in `app/_layout.tsx`:

```typescript
// Authentication flow is automatic:
// 1. User not logged in → Redirect to /auth/login
// 2. User logs in → Redirect to /(tabs)
// 3. User logs out → Redirect to /auth/login

// Access current user anywhere in the app:
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // This shouldn't happen due to auth gate, but good for type safety
    return null;
  }

  return (
    <View>
      <Text>Welcome, {user.display_name || user.email}!</Text>
    </View>
  );
}
```

### Form Validation

```typescript
import { validateLoginForm, validateSignUpForm } from '../lib/validation';

// Validate login form
const { valid, errors } = validateLoginForm(email, password);
if (!valid) {
  setErrors(errors); // { email?: string, password?: string }
}

// Validate signup form
const result = validateSignUpForm(email, password, confirmPassword);
if (!result.valid) {
  setErrors(result.errors); // { email?, password?, confirmPassword? }
}

// Individual field validation
import { validateEmail, validatePassword } from '../lib/validation';

const emailCheck = validateEmail(email);
if (!emailCheck.valid) {
  console.log(emailCheck.error); // "Please enter a valid email address"
}

const passwordCheck = validatePassword(password);
if (!passwordCheck.valid) {
  console.log(passwordCheck.error); // "Password must be at least 8 characters"
}
```

## User Flow

1. **New User Registration:**
   - User navigates to `/auth/signup`
   - Fills email, password, confirm password, and optional display name
   - Client-side validation checks form
   - Firebase creates authentication record
   - Service syncs user to Supabase `users` table
   - Auth token stored in AsyncStorage
   - User data cached in AsyncStorage
   - User is logged in and redirected to `/(tabs)`

2. **Existing User Login:**
   - User navigates to `/auth/login`
   - Fills email and password
   - Client-side validation checks form
   - Firebase authenticates user
   - Service updates `last_login_at` in Supabase
   - Auth token stored in AsyncStorage
   - User data cached in AsyncStorage
   - User is logged in and redirected to `/(tabs)`

3. **Password Reset:**
   - User navigates to `/auth/forgot-password`
   - Enters email address
   - Client-side validation checks email format
   - Firebase sends password reset email
   - Success screen displayed
   - User clicks link in email to reset password
   - User can then login with new password

4. **Session Persistence:**
   - Web: Browser local storage + AsyncStorage
   - Native: AsyncStorage
   - Firebase SDK automatically handles token refresh
   - User data loaded from AsyncStorage on app start
   - Session is restored on app restart

5. **Sign Out:**
   - User clicks logout button (in tab header)
   - Firebase session cleared
   - AsyncStorage cleared (token and user data)
   - Local state reset
   - User redirected to `/auth/login`

6. **Auth Gate:**
   - On app start, checks for authenticated user
   - If not authenticated and not on auth screen → Redirect to `/auth/login`
   - If authenticated and on auth screen → Redirect to `/(tabs)`
   - Shows loading screen during check

## Security Features

1. **Password Requirements:**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 number
   - Client-side validation before submission
   - Firebase also enforces minimum 6 characters

2. **Email Verification:**
   - Optional (can be enabled in Firebase Console)
   - Recommended for production

3. **Password Reset:**
   - Secure email-based reset flow
   - Firebase-managed email delivery
   - Time-limited reset links

4. **Session Security:**
   - Auth tokens stored in AsyncStorage
   - Automatic token refresh by Firebase
   - Tokens cleared on logout
   - No passwords stored locally

5. **Error Messages:**
   - Generic messages to prevent information disclosure
   - User-friendly but secure
   - Example: "Invalid email or password" instead of "Password incorrect"

6. **Row Level Security:**
   - Supabase RLS policies defined in migrations
   - Users can only access their own data

7. **Environment Variables:**
   - Credentials stored in `.env.local`
   - Not committed to version control
   - Separate configs for dev/production

8. **Data Validation:**
   - Client-side validation before API calls
   - Server-side validation by Firebase
   - Type safety with TypeScript strict mode

## Error Handling

The system includes comprehensive error handling with user-friendly messages:

### Firebase Error Mapping

All Firebase auth errors are converted to clear, actionable messages:

- `EMAIL_EXISTS` → "This email is already registered. Please sign in instead."
- `INVALID_EMAIL` → "Invalid email address. Please check and try again."
- `WEAK_PASSWORD` → "Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers."
- `USER_DELETED` → "No account found with this email. Please sign up."
- `INVALID_PASSWORD` → "Incorrect password. Please try again."
- `INVALID_LOGIN_CREDENTIALS` → "Invalid email or password. Please check your credentials."
- `TOO_MANY_ATTEMPTS_TRY_LATER` → "Too many failed attempts. Please try again later."
- `NETWORK_REQUEST_FAILED` → "Network error. Please check your connection and try again."
- `USER_DISABLED` → "This account has been disabled. Please contact support."

### Error Display

- Real-time validation errors shown below form fields
- Alert dialogs for authentication errors
- Loading states prevent duplicate submissions
- Network errors caught and displayed to user
- Database sync failures logged but don't block auth

## Testing

### Manual Testing Checklist

- [ ] Sign up with new email and valid password
- [ ] Sign up with existing email (should show error)
- [ ] Sign up with weak password (should show validation error)
- [ ] Sign up with non-matching passwords (should show validation error)
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password (should show error)
- [ ] Sign in with non-existent email (should show error)
- [ ] Password visibility toggle works
- [ ] Forgot password sends email
- [ ] Password reset email link works
- [ ] App restart preserves session
- [ ] Logout clears session and redirects
- [ ] Auth gate redirects unauthenticated users
- [ ] Loading states display correctly
- [ ] Form validation shows errors in real-time
- [ ] Navigation between auth screens works

### Test Credentials

For development testing, create test accounts using the signup screen at `/auth/signup`.

Example test user:
- Email: `test@example.com`
- Password: `TestPass123` (meets all requirements)

### Automated Testing

To add automated tests (recommended for production):

```typescript
// Example test structure (using Jest + React Native Testing Library)
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/auth/login';

describe('LoginScreen', () => {
  it('shows validation error for invalid email', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('you@example.com');
    
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(getByText('Sign In'));
    
    expect(getByText('Please enter a valid email address')).toBeTruthy();
  });
});
```

## Troubleshooting

### Firebase initialization errors
- **Symptom:** "Firebase not initialized" or similar errors
- **Solutions:**
  - Check `.env.local` has all Firebase credentials
  - Verify Firebase project is active in [Firebase Console](https://console.firebase.google.com)
  - Check Firebase Console authentication status
  - Ensure `app.config.js` is reading environment variables correctly

### Supabase sync failures
- **Symptom:** User can login but data doesn't appear in Supabase
- **Solutions:**
  - Verify Supabase credentials in `.env.local`
  - Check database migrations are applied: `supabase db push`
  - Verify RLS policies allow inserts
  - Check Supabase logs in [dashboard](https://app.supabase.com)
  - Note: Firebase auth will still work even if Supabase sync fails

### Auth gate not redirecting
- **Symptom:** Stuck on loading screen or wrong page
- **Solutions:**
  - Clear AsyncStorage: DevMenu → "Debug" → "Clear AsyncStorage"
  - Check console for auth errors
  - Verify `AuthProvider` wraps `RootLayoutNav`
  - Check that segments are being read correctly

### Password validation errors
- **Symptom:** "Password too weak" even with strong password
- **Solutions:**
  - Ensure password has minimum 8 characters
  - Include at least 1 uppercase letter
  - Include at least 1 number
  - Check for copy-paste issues (invisible characters)

### Session not persisting
- **Symptom:** User logged out after app restart
- **Solutions:**
  - Check AsyncStorage permissions
  - Verify platform-specific persistence settings
  - Check Firebase Auth session configuration
  - Clear and re-login to reset session

### Navigation issues
- **Symptom:** Can't navigate between auth screens
- **Solutions:**
  - Verify all auth screens are registered in `_layout.tsx`
  - Check router imports are correct
  - Clear Metro bundler cache: `npm start -- --clear`

## Next Steps

### Implemented ✅
- Email/password authentication
- Password reset flow
- Form validation
- Session persistence with AsyncStorage
- Auth gate with automatic redirects
- User-friendly error messages
- Liquid Glass UI design

### Future Enhancements

1. **Email Verification:** Require email verification before account activation
2. **Social Auth:** Add Google, Apple, Facebook sign-in
3. **Multi-Factor Auth (MFA):** Add SMS or TOTP verification
4. **Biometric Auth:** Face ID, Touch ID support
5. **Profile Management:** Allow users to update email, display name, avatar
6. **Password Change:** In-app password change (when logged in)
7. **Account Deletion:** Self-service account deletion flow
8. **Remember Me:** Optional persistent login
9. **Session Management:** 
   - View active sessions
   - Logout from all devices
   - Device tracking
10. **Security Features:**
    - Login attempt monitoring
    - Suspicious activity alerts
    - IP-based restrictions
    - Session timeout warnings
11. **Audit Logging:** Track all auth events for security
12. **OAuth Providers:** GitHub, Microsoft, etc.
13. **Magic Links:** Passwordless email authentication
14. **Phone Auth:** SMS-based authentication

## Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Context API](https://react.dev/reference/react/useContext)
