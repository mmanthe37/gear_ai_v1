# Quick Start Guide

Get Gear AI CoPilot up and running in 5 minutes!

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- A code editor (we recommend [VS Code](https://code.visualstudio.com/))

## Step 1: Clone the Repository

```bash
git clone https://github.com/mmanthe37/gear_ai_v1.git
cd gear_ai_v1
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes).

## Step 3: Set Up Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` in your editor and add your API keys:

### Minimum Required (for basic features):

```env
# Firebase (required for auth)
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# Supabase (required for database)
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### Optional (for advanced features):

```env
# OpenAI (for AI chat - Phase 2)
OPENAI_API_KEY=sk-...

# Stripe (for subscriptions)
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Step 4: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Get your config from Project Settings → General
5. Add keys to `.env.local`

## Step 5: Set Up Supabase

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run migrations:
   - Copy contents of `supabase/migrations/20250101000000_initial_schema.sql`
   - Run the query
   - Repeat for `20250101000001_rls_policies.sql`
4. Get API keys from Project Settings → API
5. Add to `.env.local`

## Step 6: Start Development Server

```bash
npm start
```

You should see a QR code and development options.

## Step 7: Run the App

### Option A: Web Browser (Easiest)

```bash
npm run web
```

Opens in your default browser at `http://localhost:8081`

### Option B: iOS Simulator (macOS only)

```bash
# Press 'i' in the terminal
# Or:
npm run ios
```

### Option C: Android Emulator

```bash
# Press 'a' in the terminal
# Or:
npm run android
```

### Option D: Physical Device

1. Install **Expo Go** app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code shown in your terminal

## What's Next?

### Explore the App

- **Home Tab**: Add your first vehicle using a VIN
- **Diagnostics Tab**: View diagnostic information (mock data in MVP)
- **Maintenance Tab**: Track service history
- **Manuals Tab**: Browse owner's manuals

### Add a Vehicle

1. Tap "Add Vehicle" on the Home screen
2. Enter a VIN (example: `1HGBH41JXMN109186`)
3. Vehicle details will be auto-populated via NHTSA API

### Try the AI Chat (Basic)

1. Tap on a vehicle card
2. Tap "Chat with AI"
3. Ask automotive questions (responses are currently simulated)

### Development Tools

- **Reload**: Press `r` in terminal or shake device
- **Dev Menu**: Press `m` in terminal or shake device
- **Debug**: Press `j` in terminal for debugger

## Common Issues

### "Metro bundler failed to start"

```bash
# Clear cache and restart
npx expo start -c
```

### "Cannot connect to Metro"

- Ensure your computer and phone are on the same Wi-Fi network
- Check firewall settings

### "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "TypeScript errors"

```bash
# Check for type errors
npx tsc --noEmit
```

## Project Structure

```
gear_ai_v1/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home/Garage
│   │   ├── diagnostics.tsx
│   │   ├── maintenance.tsx
│   │   └── manuals.tsx
│   └── chat/              # AI chat screens
├── components/            # Reusable UI components
├── services/              # API integrations
├── types/                 # TypeScript definitions
└── docs/                  # Documentation
```

## Next Steps

1. **Read Documentation**:
   - [Architecture](docs/ARCHITECTURE.md)
   - [Database Schema](docs/DATABASE_SCHEMA.md)
   - [API Integration](docs/API_INTEGRATION.md)

2. **Contribute**:
   - See [CONTRIBUTING.md](CONTRIBUTING.md)
   - Check [Issues](https://github.com/mmanthe37/gear_ai_v1/issues)

3. **Deploy**:
   - See [Build & Deployment Guide](docs/BUILD_DEPLOYMENT.md)
   - Follow [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)

## Need Help?

- **Documentation**: Check the `docs/` folder
- **Issues**: [GitHub Issues](https://github.com/mmanthe37/gear_ai_v1/issues)
- **Email**: support@gearai.app

## What's Working in MVP?

✅ **Complete**:
- React Native + Expo setup
- Navigation with Expo Router
- Liquid Glass UI components
- Firebase Auth integration (basic)
- Supabase database setup
- VIN decoder service
- Vehicle management UI
- Maintenance tracking UI

🚧 **In Progress**:
- OpenAI chat integration
- Photo uploads
- OBD-II diagnostics
- Subscription payments

## Development Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for the full feature timeline.

---

**Happy Coding!** 🚗🤖

Built with ❤️ using React Native, Expo, and Supabase.
