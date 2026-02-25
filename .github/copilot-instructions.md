# Copilot Instructions for Gear AI CoPilot

## Project Overview

Gear AI CoPilot is a React Native/Expo mobile application that serves as an intelligent automotive ownership assistant. The app consolidates fragmented automotive tools into a single "Digital Twin" for vehicles, featuring:

- VIN decoding and vehicle management
- AI-powered chat assistant for automotive questions
- Maintenance tracking and service history
- OBD-II diagnostics integration
- Real-time vehicle valuation
- Owner's manual access and RAG-powered Q&A

**Current Development Stage**: Phase 1 MVP (65% complete)
- ✅ Infrastructure: 95% complete (deployment-ready)
- ✅ Frontend UI: 95% complete (Liquid Glass design system)
- ⚠️ Backend: 35% complete (schema ready, services partial)

## Technology Stack

- **Frontend**: React Native 0.79, Expo SDK 53, TypeScript 5.8
- **Backend**: Supabase (PostgreSQL 15 + pgvector), Firebase Auth
- **AI/ML**: OpenAI GPT-4, intfloat/e5-base-v2 embeddings
- **Navigation**: Expo Router (file-based routing)
- **Styling**: Liquid Glass design system with glassmorphism

## Code Standards

### TypeScript

- **ALWAYS use TypeScript strict mode** - it's enabled in `tsconfig.json`
- Define explicit types for all function parameters and return values
- Use interfaces for object shapes (see `/types` directory for existing types)
- Avoid `any` type unless absolutely necessary and documented
- Import types from `/types/index.ts` for consistency

```typescript
// Good - Explicit types from existing type definitions
import { Vehicle, MaintenanceRecord } from '@/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: (vehicleId: string) => void;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  // Implementation
}

// Avoid - Using 'any' or missing types
function getVehicle(id): any {
  // Don't do this
}
```

### React Native & React

- Use **functional components with hooks** (no class components)
- Follow the "Liquid Glass" design system - use existing components from `/components`
- Extract reusable logic into custom hooks
- Keep components small and focused (single responsibility)
- Use meaningful prop names with proper destructuring

```typescript
// Good - Functional component with proper typing
export function ModernVehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <GlassCard onPress={() => onPress(vehicle.id)}>
      {/* Component content */}
    </GlassCard>
  );
}
```

### File Naming Conventions

- **Components**: PascalCase.tsx (e.g., `VehicleCard.tsx`, `GlassCard.tsx`)
- **Services/Utilities**: kebab-case.ts (e.g., `vin-decoder.ts`, `ai-service.ts`)
- **Types**: PascalCase.ts (e.g., `Vehicle.ts`, `Diagnostic.ts`)
- **Expo Router Pages**: lowercase.tsx or [dynamic].tsx (e.g., `index.tsx`, `[id].tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useVehicleData.ts`)

### Project Structure

```
gear_ai_v1/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   ├── chat/              # AI chat interface
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components (Liquid Glass)
├── services/              # API integration services
├── types/                 # TypeScript type definitions
├── contexts/              # React Context providers
├── supabase/              # Supabase configuration & migrations
├── docs/                  # Comprehensive documentation
└── assets/                # Images, fonts, icons
```

### Styling & UI Guidelines

- **Always use the Liquid Glass design system components**
- Import glassmorphism components: `GlassCard`, `AnimatedBackground`
- Follow the color palette in `docs/DESIGN_SYSTEM.md`
- Use `expo-linear-gradient` and `expo-blur` for glass effects
- Ensure accessibility (proper labels, contrast ratios)
- Test responsive layouts for different screen sizes

```typescript
// Good - Using existing Liquid Glass components
import { GlassCard } from '@/components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';

<GlassCard>
  <Text style={{ color: '#fff' }}>Content</Text>
</GlassCard>

// Avoid - Creating custom glass effects without reusing components
```

## Development Workflow

### Environment Setup

1. **Install dependencies**: `npm install`
2. **Set up environment variables**: Copy `.env.example` to `.env.local`
3. **Required environment variables**:
   - `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (for AI features)
   - `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` (for subscriptions)

### Running the App

```bash
npm start           # Start Expo dev server
npm run android     # Run on Android emulator
npm run ios         # Run on iOS simulator
npm run web         # Run on web browser
```

### Linting & Building

```bash
npm run lint        # Run ESLint
npm run build       # Build for web (expo export)
```

### Testing

- **Currently**: No test infrastructure is set up
- **When adding tests**: Use Jest for unit tests, Detox for E2E
- Tests should be co-located or in `__tests__` directories
- Follow naming: `*.test.ts` or `*.test.tsx`

## API Integration Practices

### Supabase

- Use the Supabase client from `lib/supabase.ts`
- Follow Row Level Security (RLS) policies defined in migrations
- Reference schema in `docs/DATABASE_SCHEMA.md`
- Use TypeScript types from `/types` that match database schema

```typescript
// Good - Using typed Supabase client
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types';

const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('user_id', userId);
```

### Firebase Auth

- Use Firebase Auth for authentication (synced with Supabase)
- Store user sessions securely with AsyncStorage
- Follow authentication patterns in `docs/AUTHENTICATION.md`

### Third-Party APIs

- **VIN Decoding**: NHTSA vPIC API (see `services/vin-decoder.ts`)
- **AI Chat**: OpenAI GPT-4 (see `services/ai-service.ts`)
- **Diagnostics**: CarMD API integration
- **Valuation**: MarketCheck, Black Book APIs
- Always handle API errors gracefully with try-catch
- Use environment variables for API keys (never hardcode)

## Commit Message Convention

Follow **Conventional Commits** specification:

```bash
feat: add vehicle photo upload
fix: correct VIN validation logic
docs: update API integration guide
style: format code with prettier
refactor: reorganize service structure
test: add unit tests for VIN decoder
chore: update dependencies
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no functional changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## What NOT to Do

### Security & Secrets

- ❌ **NEVER commit API keys, secrets, or credentials**
- ❌ **NEVER commit `.env`, `.env.local`, or `.env.production` files**
- ❌ Check that `.gitignore` properly excludes sensitive files
- ❌ Do not log sensitive user data (PII, tokens, passwords)
- ✅ Always use environment variables for sensitive configuration

### Code Quality

- ❌ Do not use `any` type without proper justification
- ❌ Do not disable TypeScript strict checks without reason
- ❌ Avoid creating duplicate components - reuse from `/components`
- ❌ Do not modify files in `.expo/`, `node_modules/`, or `dist/`
- ❌ Do not introduce breaking changes without discussion

### File Organization

- ❌ **NEVER touch or modify files in `.github/agents/`** - These contain custom agent instructions
- ❌ Do not create temporary files in the project root - use `/tmp` instead
- ❌ Do not commit build artifacts (`dist/`, `.expo/`, etc.)
- ❌ Do not modify database migrations in `supabase/migrations/` without creating new ones

### Performance & Best Practices

- ❌ Do not make unnecessary re-renders (use React.memo when appropriate)
- ❌ Avoid synchronous blocking operations in the UI thread
- ❌ Do not load large images without optimization
- ❌ Avoid deeply nested component trees

## Documentation

- Update relevant documentation when making changes:
  - `README.md` - Project overview and quick start
  - `docs/ARCHITECTURE.md` - System architecture changes
  - `docs/DATABASE_SCHEMA.md` - Database schema changes
  - `docs/API_INTEGRATION.md` - Third-party API changes
  - `CONTRIBUTING.md` - Development workflow changes

- Use JSDoc comments for functions and components:

```typescript
/**
 * Decode a VIN using the NHTSA vPIC API
 * @param vin - 17-character Vehicle Identification Number
 * @param year - Optional model year for more accurate results
 * @returns Decoded vehicle information
 * @throws {Error} If VIN format is invalid
 */
export async function decodeVIN(
  vin: string,
  year?: number
): Promise<VINDecodeResult> {
  // Implementation
}
```

## Context for Common Tasks

### Adding a New Vehicle Feature

1. Define types in `/types/vehicle.ts`
2. Update database schema in `supabase/migrations/` if needed
3. Create service in `/services/` for API integration
4. Build UI components in `/components/`
5. Add screen in `/app/` using Expo Router
6. Update documentation in `docs/`

### Integrating a New API

1. Review `docs/API_INTEGRATION.md` for patterns
2. Add API key to `.env.example` (without actual value)
3. Create service file in `/services/`
4. Add proper error handling and rate limiting
5. Use TypeScript types for API responses
6. Document the integration in `docs/API_INTEGRATION.md`

### Updating the Database Schema

1. Create a new migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Update `docs/DATABASE_SCHEMA.md`
3. Update TypeScript types in `/types/`
4. Test migration on local Supabase instance

## AI-Specific Guidelines

### When Using GitHub Copilot as a Coding Agent

- Reference this file and `docs/ARCHITECTURE.md` for context
- Review `CONTRIBUTING.md` for development standards
- Check existing type definitions in `/types` before creating new ones
- Look at existing components in `/components` for design patterns
- Always validate changes don't break the Liquid Glass design system
- Consider the Phase 1 MVP scope - focus on core features first
- Prefer minimal, surgical changes over large refactors

### Code Review Expectations

- Code should pass `npm run lint` without errors
- TypeScript strict mode should have no errors
- Changes should align with the Liquid Glass design system
- New features should have corresponding documentation updates
- API integrations should follow patterns in existing services

## Additional Resources

- **Architecture**: See `docs/ARCHITECTURE.md` for technical architecture
- **Design System**: See `docs/DESIGN_SYSTEM.md` for UI guidelines
- **Database**: See `docs/DATABASE_SCHEMA.md` for schema details
- **Security**: See `docs/SECURITY.md` for security practices
- **Roadmap**: See `docs/ROADMAP.md` for feature planning
- **Contributing**: See `CONTRIBUTING.md` for contribution guidelines

---

**Last Updated**: January 15, 2025
**Project**: Gear AI CoPilot v1.0.0
**Status**: Phase 1 MVP Development
