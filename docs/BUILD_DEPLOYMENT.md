# Gear AI CoPilot - Build & Deployment Guide

## Build Instructions

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (installed automatically with dependencies)
- iOS Simulator (macOS) or Android Studio (for native builds)

### Development Environment Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set Up Environment Variables**

   Copy `.env.example` to `.env.local` and configure your API keys:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your actual credentials (Firebase, Supabase, etc.)

3. **Start Development Server**

   ```bash
   npm start
   # or
   npx expo start
   ```

   This will start the Metro bundler. You can then:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device testing
   - Press `w` for web browser

### Building for Production

#### Web Build

```bash
npm run build
```

This creates a static export in the `dist/` directory that can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

**Deployment Example (Vercel):**

```bash
npm install -g vercel
vercel --prod
```

#### Mobile Builds (iOS & Android)

For production mobile builds, use Expo Application Services (EAS):

1. **Install EAS CLI**

   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**

   ```bash
   eas build:configure
   ```

3. **Build for iOS**

   ```bash
   eas build --platform ios --profile production
   ```

4. **Build for Android**

   ```bash
   eas build --platform android --profile production
   ```

5. **Submit to App Stores**

   ```bash
   # iOS App Store
   eas submit --platform ios
   
   # Google Play Store
   eas submit --platform android
   ```

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run Migrations

Navigate to the Supabase dashboard:
- Go to "SQL Editor"
- Create a new query
- Copy and paste the contents of `supabase/migrations/20250101000000_initial_schema.sql`
- Click "Run"
- Repeat for `20250101000001_rls_policies.sql`

Alternatively, use the Supabase CLI:

```bash
npm install -g supabase
supabase link --project-ref your-project-ref
supabase db push
```

### 3. Configure Storage Buckets

Create the following storage buckets in Supabase Dashboard:

- `vehicle-photos` (public)
- `maintenance-attachments` (private)
- `owner-manuals` (public)

Set appropriate RLS policies for each bucket.

## Firebase Setup (Authentication)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication
4. Enable Email/Password, Google, and Apple sign-in methods

### 2. Get Configuration

From Project Settings → General, get:
- API Key
- Auth Domain
- Project ID

Add these to `.env.local`

### 3. Sync with Supabase

Create a Firebase Cloud Function to sync authenticated users to Supabase:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.syncUserToSupabase = functions.auth.user().onCreate(async (user) => {
  await supabase.from('users').insert({
    firebase_uid: user.uid,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.photoURL,
  });
});
```

## Code Quality Checks

### TypeScript Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

To auto-fix linting issues:

```bash
npm run lint -- --fix
```

### Testing (To be implemented)

```bash
npm test
```

## Performance Optimization

### Web Optimization

1. **Code Splitting**: Automatically handled by Expo Router
2. **Image Optimization**: Use `expo-image` component
3. **Bundle Size Analysis**:

   ```bash
   npx expo export --platform web --source-maps
   # Analyze bundle with source-map-explorer
   npm install -g source-map-explorer
   source-map-explorer dist/_expo/static/js/web/*.js
   ```

### Mobile Optimization

1. **Use Hermes Engine** (enabled by default in Expo SDK 53)
2. **Optimize Images**: Use appropriate image formats (WebP)
3. **Lazy Loading**: Defer loading of heavy components
4. **Profile Performance**:

   ```bash
   npx expo start --profile
   ```

## Monitoring & Analytics

### Error Tracking (Sentry)

1. Install Sentry:

   ```bash
   npm install @sentry/react-native
   ```

2. Configure in `app/_layout.tsx`:

   ```typescript
   import * as Sentry from '@sentry/react-native';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     enableInExpoDevelopment: false,
   });
   ```

### Analytics (Mixpanel)

1. Install Mixpanel:

   ```bash
   npm install mixpanel-react-native
   ```

2. Initialize in app entry point

## Continuous Integration / Continuous Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Lint
        run: npm run lint
      
      - name: Build web
        run: npm run build
      
      - name: Run tests
        run: npm test
```

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
```

- Hot reload enabled
- Verbose logging
- Source maps enabled

### Staging

```bash
NODE_ENV=staging
```

- Separate Supabase project
- Test payment provider (Stripe test mode)
- Analytics enabled

### Production

```bash
NODE_ENV=production
```

- Optimized bundles
- Error logging only
- Production API endpoints
- Real payment processing

## Troubleshooting

### Common Issues

**Metro bundler cache issues:**

```bash
npx expo start -c
```

**iOS simulator not found:**

```bash
xcode-select --install
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

**Android build errors:**

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

**Dependencies out of sync:**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Security Checklist

Before deploying to production:

- [ ] All API keys in environment variables (not hardcoded)
- [ ] `.env.local` in `.gitignore`
- [ ] Firebase Auth rules configured
- [ ] Supabase RLS policies enabled
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize user input)

## Performance Benchmarks

### Target Metrics

- **Initial Load Time**: < 3 seconds (web)
- **Time to Interactive**: < 5 seconds (web)
- **App Size**: < 50 MB (mobile)
- **API Response Time**: < 500ms (p95)
- **Database Query Time**: < 100ms (p95)

### Monitoring

Use these tools to track performance:
- Lighthouse (web)
- Chrome DevTools (web)
- React Native Debugger (mobile)
- Supabase Dashboard (database)

## Support & Documentation

- **Main Documentation**: [docs/](./docs/)
- **API Integration Guide**: [docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md)
- **Architecture Overview**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Security Guidelines**: [docs/SECURITY.md](./docs/SECURITY.md)

## Contributing

See [Contributing Guidelines](CONTRIBUTING.md) for code standards and pull request process.

---

**Last Updated**: December 30, 2024  
**Maintainer**: [@mmanthe37](https://github.com/mmanthe37)
