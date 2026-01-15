# Gear AI CoPilot 🚗🤖

> Your intelligent automotive ownership assistant - powered by AI, telematics, and real-time market data.

**Gear AI CoPilot** is a comprehensive mobile application that consolidates fragmented automotive tools into a single, intelligent "Digital Twin" for your vehicle. From VIN decoding and owner's manual RAG chat to OBD-II diagnostics and real-time valuation, Gear AI transforms how you manage, maintain, and understand your vehicle.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React_Native-0.79-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![Deploy to GitHub Pages](https://github.com/mmanthe37/gear_ai_v1/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/mmanthe37/gear_ai_v1/actions/workflows/deploy-web.yml)

---

## 🚀 Live Demo

**Try it now!** Experience the Gear AI CoPilot UI and test the VIN decoder:

### 🌐 Web Version (GitHub Pages)
**[👉 Launch Live Demo](https://mmanthe37.github.io/gear_ai_v1/)** 

- ✅ No installation required
- ✅ Works in any modern browser
- ✅ Real VIN decoder API (NHTSA)
- ⚠️ Using mock data for other features (backend in development)

### 📱 iOS Simulator (Full Native Experience)

For developers and testers who want the complete mobile experience:

```bash
# Clone and install
git clone https://github.com/mmanthe37/gear_ai_v1.git
cd gear_ai_v1
npm install

# Launch in iOS simulator
npm start
# Then press 'i' for iOS simulator
```

**📖 [Complete Testing Guide](QUICK_START_TESTING.md)** - Detailed setup instructions for both web and iOS

**📋 [Test Checklist](TEST_CHECKLIST.md)** - Systematic testing guide for QA

---

## 🎯 Development Stage: Phase 1 MVP (65% Complete)

**Current Status**: Mid-to-late Phase 1 development with production-ready infrastructure and UI, but partial backend implementation.

📊 **[View Comprehensive Development Assessment](docs/APP_DEVELOPMENT_STAGE_ASSESSMENT.md)** | **[Quick Summary](DEVELOPMENT_STAGE_SUMMARY.md)**

**Key Highlights**:
- ✅ Infrastructure: 95% complete (deployment-ready)
- ✅ Frontend UI: 95% complete (all screens designed)
- ⚠️ Backend: 35% complete (schema ready, services partial)
- ⏱️ Time to MVP: 2-3 weeks (simplified) or 4-5 weeks (full)

---

## 📋 Table of Contents

- [Development Stage](#-development-stage-phase-1-mvp-65-complete)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Subscription Tiers](#-subscription-tiers)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

**Note**: UI components are complete for all features below, but backend integration is partial. See [Development Assessment](docs/APP_DEVELOPMENT_STAGE_ASSESSMENT.md) for details.

### Current (Phase 1 - MVP)

- ✅ **Liquid Glass UI**: Premium glassmorphism design system (100% complete)
- ✅ **VIN Decoding**: NHTSA API integration for vehicle identification (100% complete)
- ⚠️ **Vehicle Management**: Add vehicles via VIN entry (UI complete, DB integration pending)
- ⚠️ **Owner's Manuals**: Browse and access vehicle manuals (UI complete, content pending)
- ⚠️ **AI Chat Assistant**: Conversational AI for automotive questions (UI complete, AI integration pending)
- ⚠️ **Maintenance Tracking**: Log service history with cost tracking (UI complete, persistence pending)
- ⚠️ **Multi-Vehicle Support**: Manage multiple vehicles (UI ready, auth pending)
- ⚠️ **Diagnostic Dashboard**: View diagnostic trouble codes (UI complete, OBD-II pending)

### Coming Soon (Phase 2-3)

- 🔜 **RAG-Powered Manual Chat**: Ask specific questions, get manual-backed answers
- 🔜 **OBD-II Diagnostics**: Real-time vehicle health via Bluetooth ELM327 adapter
- 🔜 **Visual Damage Detection**: AI-powered damage assessment from photos
- 🔜 **Real-Time Valuation**: Market value tracking with depreciation analysis
- 🔜 **Loan & Lease Tracker**: Financial optimization tools

### Future (Phase 4+)

- 🚀 **Marketplace Integration**: Sell directly to AutoTrader, CarGurus
- 🚀 **Predictive Maintenance**: ML-based failure prediction
- 🚀 **Fleet Management**: Business dashboard for dealers and fleets

See [ROADMAP.md](docs/ROADMAP.md) for detailed phase planning.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React Native 0.79 with Expo SDK 53
- **Language**: TypeScript 5.8
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: Custom "Liquid Glass" design system
- **Styling**: Expo Linear Gradient, Expo Blur

### Backend
- **BaaS**: Supabase (PostgreSQL 15 + pgvector)
- **Auth**: Firebase Auth (synced with Supabase)
- **Serverless**: Supabase Edge Functions (Deno runtime)
- **Storage**: Supabase Storage (for photos, manuals)

### AI/ML
- **LLM**: OpenAI GPT-4 for conversational AI
- **Embeddings**: intfloat/e5-base-v2 (768 dimensions)
- **Vector Search**: pgvector with ivfflat indexing
- **Computer Vision**: YOLOv8 (planned for damage detection)

### Third-Party APIs
- **VIN Decoding**: NHTSA vPIC
- **Diagnostics**: CarMD
- **Valuation**: MarketCheck, Black Book
- **Parts**: SEMA Data (ACES/PIES)
- **Payments**: Stripe Connect

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- iOS Simulator (macOS) or Android Studio (for emulator)
- Expo Go app (for physical device testing)
- Supabase account (for backend)
- Firebase account (for authentication)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mmanthe37/gear_ai_v1.git
   cd gear_ai_v1
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   # Firebase
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id

   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key

   # OpenAI (optional for Phase 2)
   OPENAI_API_KEY=sk-...

   # Stripe (optional for subscriptions)
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

4. **Start the development server**

   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run on a device**

   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app (iOS/Android)

### Running on Web

```bash
npm run web
```

### Building for Production

#### Web Deployment

The app can be deployed to various hosting platforms:

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Configuration file included: `vercel.json`

**Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Configuration file included: `netlify.toml`

**Manual Build**
```bash
# Build for web
npm run build

# Output directory: dist/
# Deploy dist/ to any static hosting service
```

#### Mobile Builds

For production mobile builds, use Expo Application Services (EAS):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

Configuration file included: `eas.json`

See [BUILD_DEPLOYMENT.md](docs/BUILD_DEPLOYMENT.md) and [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for detailed instructions.

---

## 🚢 Deployment Guide

### Prerequisites

Before deploying, ensure you have:

- [ ] All environment variables configured
- [ ] Firebase production project set up
- [ ] Supabase production project set up
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (handled by hosting provider)

### Quick Deploy to Vercel

1. **Fork and clone the repository**

2. **Configure environment variables** in Vercel dashboard:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

3. **Connect repository** to Vercel:
   ```bash
   vercel link
   vercel --prod
   ```

4. **Set up custom domain** (optional):
   - Go to Vercel dashboard → Settings → Domains
   - Add your custom domain

### Environment Setup

Create a `.env.production` file with your production credentials:

```env
NODE_ENV=production
FIREBASE_API_KEY=your_production_key
SUPABASE_URL=https://your-prod-project.supabase.co
# See .env.production template for all variables
```

### Database Migration

Run migrations on your production Supabase instance:

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20250101000000_initial_schema.sql`
3. Run `supabase/migrations/20250101000001_rls_policies.sql`

### Health Checks

Access health status endpoint:
```
GET /api/health
```

Returns system status and service availability.

### Monitoring

Configure monitoring services:

- **Error Tracking**: Sentry
- **Analytics**: Mixpanel or Google Analytics
- **Uptime Monitoring**: UptimeRobot or Pingdom

See [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for complete checklist.

---

## 📁 Project Structure

```
gear_ai_v1/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Garage/Home screen
│   │   ├── diagnostics.tsx  # Diagnostics screen
│   │   ├── maintenance.tsx  # Maintenance screen
│   │   └── manuals.tsx      # Manuals screen
│   ├── chat/                # AI chat interface
│   │   └── [id].tsx         # Dynamic chat per vehicle
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry redirect
├── components/              # Reusable UI components
│   ├── GlassCard.tsx        # Glassmorphism card component
│   ├── ModernVehicleCard.tsx
│   ├── ModernDiagnosticCard.tsx
│   ├── ModernServiceCard.tsx
│   ├── ModernStatsCard.tsx
│   ├── ChatBubble.tsx
│   ├── AddVehicleModal.tsx
│   └── AnimatedBackground.tsx
├── services/                # API integration services (to be created)
│   ├── vin-decoder.ts       # NHTSA VIN decoding
│   ├── ai-service.ts        # OpenAI integration
│   ├── diagnostic-service.ts # CarMD integration
│   └── valuation-service.ts # MarketCheck/Black Book
├── types/                   # TypeScript type definitions (to be created)
│   ├── vehicle.ts
│   ├── diagnostic.ts
│   └── maintenance.ts
├── supabase/                # Supabase configuration
│   └── migrations/          # Database migrations
├── docs/                    # Comprehensive documentation
│   ├── APP_DEVELOPMENT_STAGE_ASSESSMENT.md  # Detailed dev stage analysis
│   ├── ARCHITECTURE.md      # System architecture
│   ├── DATABASE_SCHEMA.md   # Database design
│   ├── API_INTEGRATION.md   # Third-party APIs
│   ├── DESIGN_SYSTEM.md     # UI/UX guidelines
│   ├── SECURITY.md          # Security & compliance
│   ├── ROADMAP.md           # Product roadmap
│   ├── DEPLOYMENT_READINESS.md  # Deployment assessment
│   └── ... (more docs)
├── assets/                  # Images, fonts, icons
├── DEVELOPMENT_STAGE_SUMMARY.md  # Quick dev stage summary
├── .gitignore
├── package.json
├── tsconfig.json
├── app.json                 # Expo configuration
└── README.md
```

---

## 📚 Documentation

For detailed technical documentation, see:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, technology stack, feature modules
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Complete database schema with RLS policies
- **[API_INTEGRATION.md](docs/API_INTEGRATION.md)** - Third-party API specifications and implementation
- **[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** - "Liquid Glass" UI design guidelines
- **[SECURITY.md](docs/SECURITY.md)** - Security architecture and compliance (GDPR, CCPA)
- **[ROADMAP.md](docs/ROADMAP.md)** - Development phases and feature timeline

---

## 💰 Subscription Tiers

| Feature | Free | Pro ($9.99/mo) | Mechanic ($19.99/mo) | Dealer ($99.99/mo) |
|---------|------|----------------|---------------------|-------------------|
| Vehicles | 1 | 3 | Unlimited | Unlimited |
| VIN Entry | ✅ | ✅ | ✅ | ✅ |
| OCR VIN Scan | ❌ | ✅ | ✅ | ✅ |
| Manual Access | ✅ | ✅ | ✅ | ✅ |
| Basic AI Chat | ✅ | ✅ | ✅ | ✅ |
| RAG Manual Chat | ❌ | ✅ | ✅ | ✅ |
| OBD-II Diagnostics | ❌ | ❌ | ✅ | ✅ |
| Damage Detection | ❌ | ❌ | ✅ | ✅ |
| Valuation Tracking | ❌ | ✅ | ✅ | ✅ |
| Marketplace Tools | ❌ | ❌ | ✅ | ✅ |
| Web Dashboard | ❌ | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

---

## 🗺️ Roadmap

- **Q1 2025**: MVP Launch (Phase 1) - Auth, Vehicle Management, Basic AI Chat
- **Q2 2025**: RAG & Diagnostics (Phase 2) - Manual RAG, OBD-II integration
- **Q3 2025**: Visual Intelligence (Phase 3) - Damage detection, Valuation API
- **Q4 2025**: Marketplace (Phase 4) - Peer-to-peer sales, Shop network
- **Q1 2026**: Fleet Management (Phase 5) - Business dashboard, API access
- **2026+**: Predictive ML, Global expansion, AR features

See [ROADMAP.md](docs/ROADMAP.md) for detailed feature planning.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript strict mode
- Follow the existing code style (Prettier + ESLint)
- Write descriptive commit messages (Conventional Commits)
- Add tests for new features (when applicable)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NHTSA** - Free VIN decoding API
- **Supabase** - Backend infrastructure
- **OpenAI** - GPT-4 and embeddings
- **Expo** - React Native development platform
- Inspired by modern automotive digital dashboards and AI-first design

---

## 📞 Contact

- **Project Maintainer**: [@mmanthe37](https://github.com/mmanthe37)
- **Email**: support@gearai.app (planned)
- **Issues**: [GitHub Issues](https://github.com/mmanthe37/gear_ai_v1/issues)

---

**Built with ❤️ for automotive enthusiasts and everyday drivers alike.**
