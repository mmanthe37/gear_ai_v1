# Gear AI CoPilot - Quick Start Guide

**Get your app running in 10 minutes!** ⚡

---

## 🚨 Critical First Steps

### 1. Set Up Environment (5 minutes)

```bash
# Copy the environment template
cp .env.example .env.local
```

Then edit `.env.local` and add your credentials:

```env
# Firebase (Get from https://console.firebase.google.com/)
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id

# Supabase (Get from https://app.supabase.com/)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_here
```

**Don't have these?** You MUST create accounts:
- Firebase: https://console.firebase.google.com/
- Supabase: https://app.supabase.com/

### 2. Start the App (30 seconds)

```bash
# Dependencies already installed! ✅

# Start development server
npm start

# Or run directly on web
npm run web
```

### 3. Test It Works (30 seconds)

Open the app and:
- ✅ You should see the garage screen with mock vehicles
- ✅ Navigation should work (4 tabs at bottom)
- ⚠️ Login won't work yet (needs implementation)
- ⚠️ Data won't save (needs backend connection)

---

## 🎯 What Works Right Now

### ✅ Fully Functional
- Beautiful "Liquid Glass" UI design
- All navigation and routing
- VIN decoder service (NHTSA API)
- Mock data display
- All UI components render correctly

### ⚠️ Partially Working
- Authentication screens (UI only, not connected)
- Vehicle management (displays mock data)
- Maintenance tracking (UI only)
- Diagnostics (UI only)
- Manuals (UI only)

### ❌ Not Implemented
- User login/signup (needs implementation)
- Data persistence (needs database connection)
- AI chat functionality (needs OpenAI integration)
- Photo uploads (needs Supabase Storage)
- Subscriptions (needs Stripe)

---

## 🚀 Next Steps - Pick Your Priority

### Option 1: Get Authentication Working 🔐

**What you'll get:**
- User registration and login
- Password reset
- Protected routes
- User profile management

**Time estimate:** 2-3 hours  
**Complexity:** Medium

### Option 2: Connect Database 💾

**What you'll get:**
- Real vehicle data storage
- Save and retrieve maintenance records
- User-specific data
- Data persistence across sessions

**Time estimate:** 3-4 hours  
**Complexity:** Medium

### Option 3: Full Authentication + Database 🎯

**What you'll get:**
- Complete user system
- Data persistence
- Multi-user support
- Foundation for all other features

**Time estimate:** 5-7 hours  
**Complexity:** Medium-High  
**Recommended!** ⭐

---

## 📋 Environment Setup Details

### Get Firebase Credentials

1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" → Web app
5. Copy the config values

### Get Supabase Credentials

1. Go to https://app.supabase.com/
2. Click "New project" or select existing
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`

### Run Database Migrations

After getting Supabase credentials:

1. Go to your Supabase Dashboard → SQL Editor
2. Run this file: `supabase/migrations/20250101000000_initial_schema.sql`
3. Then run: `supabase/migrations/20250101000001_rls_policies.sql`

---

## 🐛 Common Issues

### "Cannot find module 'expo'"
```bash
npm install
```

### "Firebase: Error (auth/invalid-api-key)"
- You need to set up `.env.local` with real Firebase credentials
- See "Set Up Environment" above

### "Supabase client not initialized"
- You need to set up `.env.local` with real Supabase credentials
- See "Set Up Environment" above

### Build errors
```bash
# Clean and reinstall
rm -rf node_modules
npm install
```

---

## 💡 Tips

### Development Workflow

1. **Make changes** - Edit code in your IDE
2. **Hot reload** - App updates automatically
3. **Test** - Verify changes work
4. **Repeat**

### Testing on Different Platforms

```bash
# Web (easiest, fastest)
npm run web

# iOS (macOS only)
npm run ios

# Android (requires Android Studio)
npm run android

# Physical device (scan QR code with Expo Go app)
npm start
```

### Key Files to Know

- `app/(tabs)/index.tsx` - Main garage/home screen
- `services/auth-service.ts` - Authentication logic
- `lib/firebase.ts` - Firebase config
- `lib/supabase.ts` - Supabase config
- `types/` - TypeScript type definitions

---

## 📚 Full Documentation

For comprehensive information, see:
- **[COPILOT_SETUP_GUIDE.md](COPILOT_SETUP_GUIDE.md)** - Complete AI partner guide
- **[README.md](README.md)** - Project overview
- **[DEVELOPMENT_STAGE_SUMMARY.md](DEVELOPMENT_STAGE_SUMMARY.md)** - Current status

---

## 🆘 Need Help?

**I can help with:**
- Implementing features
- Fixing bugs
- Writing tests
- Optimizing code
- Explaining architecture

**Just tell me:**
1. What you want to build
2. Any errors you're seeing
3. Your priority level

**Example:**
> "I want to implement the authentication flow. I have Firebase credentials 
> set up in .env.local. Can you create the login and signup screens and 
> connect them to Firebase?"

---

## ✅ Checklist

Before starting development:

- [ ] Created Firebase project
- [ ] Created Supabase project
- [ ] Created `.env.local` file
- [ ] Added Firebase credentials to `.env.local`
- [ ] Added Supabase credentials to `.env.local`
- [ ] Ran `npm start` successfully
- [ ] App loads without errors
- [ ] Decided on first feature to build

---

**Ready? Tell me what you want to build first!** 🚀
