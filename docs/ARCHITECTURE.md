# Gear AI CoPilot - Technical Architecture

## 1. Executive Technical Summary

### 1.1 Project Vision and Scope

**Gear AI CoPilot** represents a transformative evolution in the digital management of automotive assets, converging advanced telematics, generative artificial intelligence, and financial modeling into a unified, mobile-first ecosystem. The application is conceptualized not merely as a utility but as an intelligent "Digital Twin" for the user's vehicle—a system capable of ingesting static documentation, interpreting real-time hardware telemetry, and analyzing dynamic market conditions to provide a holistic ownership assistant.

The platform addresses a fragmented automotive landscape where vehicle owners currently rely on disparate tools: physical owner's manuals for operations, standalone OBD-II scanners for diagnostics, third-party websites for valuation, and spreadsheets for financial tracking. Gear AI CoPilot consolidates these verticals into a single "Super App" powered by a Retrieval-Augmented Generation (RAG) cognitive engine.

### 1.2 Architectural Philosophy

The system architecture is predicated on a **Hub-and-Spoke topology** where a centralized, serverless cloud infrastructure serves as the single source of truth, orchestrating data flow between the Edge Intelligence Layer (mobile devices and IoT sensors) and the Cognitive Processing Layer (LLMs and Vector Search).

#### Key Architectural Principles

1. **Scalability & Modularity**: The backend leverages Supabase as a unified Backend-as-a-Service (BaaS), utilizing PostgreSQL not just for relational data but as a high-performance vector store via the pgvector extension.

2. **Edge-First Computation**: To ensure responsiveness, particularly for the OBD-II diagnostics and visual analysis, significant processing is offloaded to the client side. The mobile application integrates native modules for Bluetooth Low Energy (BLE) connectivity.

3. **Privacy & Security**: Given the sensitivity of location data and financial records, the architecture enforces strict Row Level Security (RLS) policies at the database layer, ensuring that users can strictly access only their own vehicle data.

### 1.3 Strategic Functional Objectives

The technical roadmap is driven by three core pillars:

1. **Semantic Mastery (Level 4 Conversational AI)**: Moving beyond simple chatbots, the system aims for "Level 4" competence, where the AI understands the "why" and "how" of vehicle repair through a bespoke RAG pipeline.

2. **Visual & Sensor Intelligence**: The "Mechanic" tier unlocks physical world interaction by integrating custom-trained YOLOv8 models for damage assessment and aggregating real-time PIDs from the ECU via ELM327 adapters.

3. **Financial Asset Optimization**: Recognizing the vehicle as a depreciating asset, the platform integrates institutional-grade valuation APIs and amortization algorithms to track equity in real-time.

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (React Native/Expo)  │  Web Portal (Next.js 14) │
│  - BLE OBD-II Integration         │  - Fleet Dashboard       │
│  - Camera/OCR                     │  - Analytics & Reports   │
│  - Local Data Buffering           │  - Bulk Management       │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
                  ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Firebase Auth  │  Supabase Edge Functions  │  API Gateway  │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
                  ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────┤
│               Supabase (PostgreSQL 15)                       │
│  - Relational Data (Users, Vehicles, Maintenance)           │
│  - Vector Store (pgvector for RAG)                          │
│  - Row Level Security (RLS)                                  │
│  - Real-time Subscriptions                                   │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
                  ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                THIRD-PARTY SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  OpenAI (GPT-4)     │  NHTSA vPIC    │  Stripe Connect     │
│  CarMD Diagnostics  │  MarketCheck   │  Google Vision API  │
│  SEMA Data (Parts)  │  Black Book    │  Mapbox (EV)        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

#### Frontend
- **Mobile**: React Native 0.79 with Expo SDK 53
- **Web**: Next.js 14 (App Router) with React 19
- **UI Framework**: Custom "Liquid Glass" design system
- **State Management**: React Context + Local State
- **Styling**: Expo Linear Gradient, Expo Blur for glassmorphism

#### Backend
- **BaaS**: Supabase (PostgreSQL 15 + pgvector)
- **Serverless Functions**: Supabase Edge Functions (Deno runtime)
- **Authentication**: Firebase Auth (synced with Supabase)
- **File Storage**: Supabase Storage

#### AI/ML
- **LLM**: OpenAI GPT-4 for conversational AI
- **Embeddings**: intfloat/e5-base-v2 (768 dimensions)
- **Computer Vision**: YOLOv8 for damage detection
- **OCR**: Google Cloud Vision API

#### Infrastructure
- **Vector Search**: pgvector with ivfflat indexing
- **CDN**: Supabase CDN for static assets
- **Monitoring**: Supabase Analytics + Custom logging

## 3. Core Feature Modules

### 3.1 Vehicle Identity & Knowledge Base

**VIN Decoding Engine**
- Primary API: NHTSA vPIC (National Highway Traffic Safety Administration)
- Workflow: VIN input → API decode → Data validation → Database storage
- Extended enrichment: CARFAX/AutoCheck for service history, CarsXE for options

**RAG (Retrieval-Augmented Generation) Pipeline**
- Document parsing: PyMuPDF4LLM for PDF → Markdown conversion
- Chunking strategy: Hierarchical (Parent: 2048 tokens, Child: 256 tokens)
- Embedding model: intfloat/e5-base-v2
- Search: Hybrid (Semantic + BM25 keyword search)
- Reranking: Cross-Encoder (BGE Reranker) for top-k results

### 3.2 Diagnostics & Maintenance ("Mechanic" Tier)

**Real-Time OBD-II Integration**
- Hardware: ELM327 Bluetooth Low Energy (BLE) adapters
- Protocol: Standard OBD-II commands (Mode 01-09)
- Data flow: ECU → BLE → Mobile App → Cloud Storage
- DTC Analysis: Code retrieval + AI contextual interpretation

**Visual Diagnostics**
- Damage detection: YOLOv8 trained on COCO-Car-Damage dataset
- Part identification: Google Cloud Vision API + SEMA Data cross-reference
- Cost estimation: RepairPal API for local repair costs

### 3.3 Market Intelligence & Financial Management

**Real-Time Valuation Engine**
- Data sources: MarketCheck (listings) + Black Book (wholesale/auction)
- Depreciation algorithm: Base value - Mileage adjustment - Condition penalty
- Update frequency: Nightly batch job

**Loan & Lease Tracker**
- Amortization calculator: Standard loan formulas
- Lease buyout analysis: Residual vs. market value comparison
- Payment optimization: Early payment impact calculator

**AI Selling Assistant**
- Listing generation: LLM-powered description from vehicle data
- Image optimization: Background removal API
- Market syndication: (Roadmap) AutoTrader, Facebook Marketplace, CarGurus APIs

### 3.4 Customization & Connectivity

**Mods & Customization Database**
- API: SEMA Data (ACES/PIES standards)
- Fitment validation: Year/Make/Model/Engine matching
- Parts catalog: Aftermarket performance and appearance parts

**Local Resources & Geolocation**
- Service locator: Google Places API (car_repair, >4.5 stars)
- EV charging: Mapbox EV Charge Finder (J1772, CCS, Tesla connectors)
- Contextual search: Triggered by diagnostic codes

## 4. Data Architecture

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed table definitions and relationships.

### 4.1 Core Entities

- **users**: User profiles and authentication
- **vehicles**: Vehicle records (VIN, make, model, year, trim)
- **manuals**: Owner's manual documents and metadata
- **vector_embeddings**: Manual chunks with embeddings for RAG
- **maintenance_records**: Service history (routine, repair, diagnostic)
- **financial_accounts**: Loans, leases, cash purchases
- **chat_sessions**: Conversational AI interaction logs
- **diagnostic_codes**: OBD-II trouble codes and analysis

## 5. Security & Compliance

### 5.1 Authentication & Authorization

- **Identity Provider**: Firebase Auth (Google, Apple, Email/Password, MFA)
- **Database Security**: Supabase Row Level Security (RLS) policies
- **API Security**: JWT token validation on all Edge Functions
- **Session Management**: Automatic token refresh with Firebase SDK

### 5.2 Data Protection

- **Encryption at Rest**: PostgreSQL pgcrypto for sensitive financial data
- **Encryption in Transit**: TLS 1.3 for all API communications
- **PII Handling**: GDPR/CCPA compliant data retention policies
- **Location Data**: Anonymized for analytics, user-deletable

### 5.3 Compliance Standards

- **NHTSA Regulations**: Accurate VIN decoding and recall information
- **Financial Data**: PCI DSS compliance for payment processing (Stripe)
- **API Rate Limiting**: Prevent abuse and ensure fair usage
- **Audit Logging**: All database mutations logged with user context

## 6. Deployment & Infrastructure

### 6.1 Development Environment

- **Local Dev**: Expo Go for mobile, Next.js dev server for web
- **Database**: Local Supabase instance or cloud dev project
- **API Keys**: Environment variables (.env.local)

### 6.2 Staging Environment

- **Mobile**: Expo EAS Build (internal distribution)
- **Web**: Vercel preview deployments
- **Database**: Supabase staging project
- **CI/CD**: GitHub Actions for automated testing and deployment

### 6.3 Production Environment

- **Mobile**: App Store (iOS) + Google Play (Android)
- **Web**: Vercel production deployment
- **Database**: Supabase production (multi-region)
- **CDN**: Supabase CDN + Vercel Edge Network
- **Monitoring**: Supabase Analytics, Sentry for error tracking

## 7. Performance Optimization

### 7.1 Mobile App

- **Code Splitting**: React lazy loading for heavy components
- **Image Optimization**: Expo Image with caching
- **Network**: Request batching and local caching
- **Offline Support**: AsyncStorage for critical data

### 7.2 Web Portal

- **SSR**: Next.js Server-Side Rendering for SEO
- **ISR**: Incremental Static Regeneration for content pages
- **Code Splitting**: Automatic route-based splitting
- **CDN**: Static assets on Vercel Edge Network

### 7.3 Database

- **Indexing**: B-tree for relational queries, ivfflat for vector search
- **Connection Pooling**: Supabase pgBouncer
- **Query Optimization**: Materialized views for complex analytics
- **Caching**: Supabase real-time cache for frequently accessed data

## 8. Scalability Strategy

### 8.1 Horizontal Scaling

- **Database**: Supabase auto-scaling read replicas
- **Edge Functions**: Deno Deploy global distribution
- **File Storage**: Supabase Storage with CDN

### 8.2 Vertical Scaling

- **Database**: Upgrade PostgreSQL instance size as needed
- **Compute**: Increase Edge Function memory allocation
- **Storage**: Expand storage capacity for manuals and images

### 8.3 Load Balancing

- **Geographic Distribution**: Supabase multi-region deployment
- **API Gateway**: Automatic request routing to nearest region
- **CDN**: Static asset distribution via global edge network

## 9. Disaster Recovery & Business Continuity

### 9.1 Backup Strategy

- **Database**: Daily automated backups (7-day retention)
- **Point-in-Time Recovery**: 24-hour PITR window
- **File Storage**: Versioned backups for all user uploads
- **Configuration**: Infrastructure as Code (Terraform/Pulumi)

### 9.2 Incident Response

- **Monitoring**: 24/7 uptime monitoring (UptimeRobot)
- **Alerting**: PagerDuty for critical incidents
- **Runbooks**: Documented procedures for common issues
- **Post-Mortems**: Incident analysis and prevention

## 10. Development Workflow

### 10.1 Version Control

- **Repository**: GitHub (main, develop, feature branches)
- **Branching Strategy**: GitFlow for release management
- **Code Review**: Required PR reviews before merge
- **Commit Standards**: Conventional Commits specification

### 10.2 Testing Strategy

- **Unit Tests**: Jest for business logic
- **Integration Tests**: Supabase test environment
- **E2E Tests**: Detox for mobile, Playwright for web
- **Manual QA**: Pre-release testing checklist

### 10.3 Release Process

1. Feature development on feature branches
2. Merge to develop branch
3. Internal testing on staging environment
4. Create release branch
5. Final QA and bug fixes
6. Merge to main
7. Deploy to production
8. Tag release version
9. Create release notes

## 11. Future Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed phase planning.

### Phase 2: Predictive Maintenance (Q2 2025)
- ML model for failure prediction based on aggregated OBD data
- Proactive maintenance alerts
- Parts ordering integration

### Phase 3: Marketplace (Q3 2025)
- Peer-to-peer vehicle marketplace
- In-app messaging and negotiation
- Escrow and transaction management

### Phase 4: Fleet Management (Q4 2025)
- Business-tier multi-vehicle dashboard
- Driver behavior analytics
- Maintenance scheduling and dispatch

## 12. Conclusion

This architecture provides a robust, scalable foundation for Gear AI CoPilot. By leveraging modern serverless technologies, AI/ML capabilities, and a mobile-first approach, the platform delivers a comprehensive automotive ownership experience that consolidates fragmented tools into a unified, intelligent assistant.

For implementation details, see:
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database structure
- [API_INTEGRATION.md](./API_INTEGRATION.md) - Third-party API specifications
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - UI/UX guidelines
- [SECURITY.md](./SECURITY.md) - Security protocols
- [ROADMAP.md](./ROADMAP.md) - Development phases
