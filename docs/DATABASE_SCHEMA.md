# Gear AI CoPilot - Database Schema

## Overview

The database schema is designed around PostgreSQL 15 with the pgvector extension for semantic search capabilities. The schema enforces strict referential integrity and leverages Row Level Security (RLS) for multi-tenant data isolation.

## Core Tables

### 1. Users Table

Stores user account information and subscription details.

```sql
CREATE TABLE public.users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  tier VARCHAR(20) CHECK (tier IN ('free', 'pro', 'mechanic', 'dealer')) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'none')) DEFAULT 'none',
  subscription_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_users_firebase_uid ON public.users(firebase_uid);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tier ON public.users(tier);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = firebase_uid);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = firebase_uid);
```

### 2. Vehicles Table

Central table for vehicle information decoded from VIN.

```sql
CREATE TABLE public.vehicles (
  vehicle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
  vin VARCHAR(17) NOT NULL,
  year INT NOT NULL CHECK (year >= 1900 AND year <= 2100),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  engine_displacement_l DECIMAL(4, 2),
  engine_cylinders INT,
  fuel_type VARCHAR(50),
  transmission VARCHAR(100),
  drivetrain VARCHAR(50),
  body_type VARCHAR(50),
  plant_country VARCHAR(100),
  plant_city VARCHAR(100),
  in_service_date DATE,
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  current_market_value DECIMAL(10, 2),
  current_mileage INT,
  profile_image TEXT,
  color VARCHAR(50),
  license_plate VARCHAR(20),
  manual_id UUID REFERENCES public.manuals(manual_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_vin ON public.vehicles(vin);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX idx_vehicles_year ON public.vehicles(year);

-- RLS Policies
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = (SELECT firebase_uid FROM public.users WHERE user_id = vehicles.user_id));

CREATE POLICY "Users can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = (SELECT firebase_uid FROM public.users WHERE user_id = vehicles.user_id));

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = (SELECT firebase_uid FROM public.users WHERE user_id = vehicles.user_id));

CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = (SELECT firebase_uid FROM public.users WHERE user_id = vehicles.user_id));
```

### 3. Manuals Table

Stores owner's manual documents and metadata.

```sql
CREATE TABLE public.manuals (
  manual_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  trim VARCHAR(100),
  file_url TEXT,
  file_size_bytes BIGINT,
  page_count INT,
  language VARCHAR(10) DEFAULT 'en',
  version VARCHAR(50),
  upload_date TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  processing_status VARCHAR(50) CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_manuals_make_model_year ON public.manuals(make, model, year);
CREATE INDEX idx_manuals_processing_status ON public.manuals(processing_status);

-- Note: Manuals are read-only for users, no RLS policies for modification
```

### 4. Vector Embeddings Table

Stores chunked manual content with vector embeddings for RAG.

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.vector_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manual_id UUID REFERENCES public.manuals(manual_id) ON DELETE CASCADE NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INT NOT NULL,
  parent_chunk_id UUID REFERENCES public.vector_embeddings(embedding_id),
  page_number INT,
  section_title VARCHAR(255),
  embedding vector(1536), -- text-embedding-3-small dimension
  token_count INT,
  chunk_type VARCHAR(50) CHECK (chunk_type IN ('parent', 'child')) DEFAULT 'child',
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_embeddings_manual_id ON public.vector_embeddings(manual_id);
CREATE INDEX idx_embeddings_chunk_index ON public.vector_embeddings(chunk_index);
CREATE INDEX idx_embeddings_parent_chunk ON public.vector_embeddings(parent_chunk_id);

-- Vector similarity index (ivfflat)
CREATE INDEX idx_embeddings_vector ON public.vector_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_manual_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_manual_id uuid DEFAULT NULL
)
RETURNS TABLE (
  embedding_id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ve.embedding_id,
    ve.chunk_text,
    1 - (ve.embedding <=> query_embedding) as similarity
  FROM public.vector_embeddings ve
  WHERE 
    (filter_manual_id IS NULL OR ve.manual_id = filter_manual_id)
    AND 1 - (ve.embedding <=> query_embedding) > match_threshold
  ORDER BY ve.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 5. Maintenance Records Table

Tracks all service and repair activities.

```sql
CREATE TABLE public.maintenance_records (
  record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) CHECK (type IN ('routine', 'repair', 'modification', 'diagnostic', 'inspection')) NOT NULL,
  date DATE NOT NULL,
  mileage INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2),
  labor_cost DECIMAL(10, 2),
  parts_cost DECIMAL(10, 2),
  shop_name VARCHAR(255),
  shop_location VARCHAR(255),
  technician_name VARCHAR(255),
  dtc_codes TEXT[], -- Array of diagnostic trouble codes
  parts_replaced TEXT[],
  attachment_urls TEXT[],
  next_service_date DATE,
  next_service_mileage INT,
  warranty_covered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_maintenance_vehicle_id ON public.maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_date ON public.maintenance_records(date DESC);
CREATE INDEX idx_maintenance_type ON public.maintenance_records(type);
CREATE INDEX idx_maintenance_dtc_codes ON public.maintenance_records USING GIN(dtc_codes);

-- RLS Policies
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their vehicle maintenance"
  ON public.maintenance_records FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

CREATE POLICY "Users can insert maintenance for their vehicles"
  ON public.maintenance_records FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );
```

### 6. Financial Accounts Table

Manages loans, leases, and cash purchase tracking.

```sql
CREATE TABLE public.financial_accounts (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('loan', 'lease', 'cash')) NOT NULL,
  lender_name VARCHAR(100),
  account_number BYTEA,
  start_date DATE NOT NULL,
  end_date DATE,
  term_months INT,
  interest_rate DECIMAL(5, 4), -- APR as decimal (e.g., 0.0549 for 5.49%)
  money_factor DECIMAL(7, 6), -- For leases
  residual_value DECIMAL(10, 2), -- For leases
  monthly_payment DECIMAL(10, 2),
  down_payment DECIMAL(10, 2),
  principal_amount DECIMAL(10, 2),
  current_balance DECIMAL(10, 2),
  total_paid DECIMAL(10, 2) DEFAULT 0,
  payoff_date DATE,
  status VARCHAR(50) CHECK (status IN ('active', 'paid_off', 'refinanced', 'defaulted')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_financial_vehicle_id ON public.financial_accounts(vehicle_id);
CREATE INDEX idx_financial_type ON public.financial_accounts(type);
CREATE INDEX idx_financial_status ON public.financial_accounts(status);

-- RLS Policies
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their vehicle finances"
  ON public.financial_accounts FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );
```

### 7. Diagnostic Codes Table

Stores OBD-II diagnostic trouble codes with AI analysis.

```sql
CREATE TABLE public.diagnostic_codes (
  diagnostic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(10) NOT NULL, -- e.g., P0420, B1342
  code_type VARCHAR(10) CHECK (code_type IN ('P', 'C', 'B', 'U')), -- Powertrain, Chassis, Body, Network
  description TEXT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  detected_at TIMESTAMP DEFAULT NOW(),
  cleared_at TIMESTAMP,
  status VARCHAR(50) CHECK (status IN ('active', 'pending', 'resolved', 'false_positive')) DEFAULT 'active',
  mileage_at_detection INT,
  freeze_frame_data JSONB,
  ai_analysis TEXT,
  recommended_actions TEXT[],
  estimated_repair_cost_min DECIMAL(10, 2),
  estimated_repair_cost_max DECIMAL(10, 2),
  related_maintenance_id UUID REFERENCES public.maintenance_records(record_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_diagnostic_vehicle_id ON public.diagnostic_codes(vehicle_id);
CREATE INDEX idx_diagnostic_code ON public.diagnostic_codes(code);
CREATE INDEX idx_diagnostic_status ON public.diagnostic_codes(status);
CREATE INDEX idx_diagnostic_severity ON public.diagnostic_codes(severity);
CREATE INDEX idx_diagnostic_detected ON public.diagnostic_codes(detected_at DESC);

-- RLS Policies
ALTER TABLE public.diagnostic_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their vehicle diagnostics"
  ON public.diagnostic_codes FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );
```

### 8. Chat Sessions Table

Stores conversational AI interactions.

```sql
CREATE TABLE public.chat_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE SET NULL,
  title VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW(),
  message_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  context_type VARCHAR(50) CHECK (context_type IN ('general', 'manual', 'diagnostic', 'maintenance', 'valuation')) DEFAULT 'general',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_chat_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_vehicle_id ON public.chat_sessions(vehicle_id);
CREATE INDEX idx_chat_started_at ON public.chat_sessions(started_at DESC);

-- RLS Policies
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid()));
```

### 9. Chat Messages Table

Stores individual messages within chat sessions.

```sql
CREATE TABLE public.chat_messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INT,
  model_version VARCHAR(50),
  retrieval_context JSONB, -- RAG sources used
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_messages_created_at ON public.chat_messages(created_at);

-- RLS Policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their sessions"
  ON public.chat_messages FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM public.chat_sessions 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );
```

### 10. Service Reminders Table

Automated maintenance reminders based on mileage and time.

```sql
CREATE TABLE public.service_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- e.g., 'oil_change', 'tire_rotation'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_mileage INT,
  due_date DATE,
  interval_miles INT,
  interval_months INT,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status VARCHAR(50) CHECK (status IN ('upcoming', 'due', 'overdue', 'completed', 'dismissed')) DEFAULT 'upcoming',
  notification_sent BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_reminders_vehicle_id ON public.service_reminders(vehicle_id);
CREATE INDEX idx_reminders_due_date ON public.service_reminders(due_date);
CREATE INDEX idx_reminders_status ON public.service_reminders(status);

-- RLS Policies
ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their vehicle reminders"
  ON public.service_reminders FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );
```

## Database Functions

### Update Timestamps Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add similar triggers for other tables
```

### Calculate Vehicle Depreciation

```sql
CREATE OR REPLACE FUNCTION calculate_vehicle_value(
  p_vehicle_id UUID,
  p_base_market_value DECIMAL,
  p_current_mileage INT,
  p_avg_mileage INT,
  p_mileage_adjustment DECIMAL DEFAULT 0.10,
  p_condition_penalty DECIMAL DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
  calculated_value DECIMAL;
BEGIN
  calculated_value := p_base_market_value 
                     - (p_mileage_adjustment * (p_current_mileage - p_avg_mileage))
                     - (p_condition_penalty);
  
  -- Ensure value doesn't go below a minimum threshold
  IF calculated_value < 0 THEN
    calculated_value := 0;
  END IF;
  
  RETURN calculated_value;
END;
$$ LANGUAGE plpgsql;
```

## Database Migrations

Database migrations are stored in `/supabase/migrations/` and are version-controlled. Each migration file follows the naming convention:

```
YYYYMMDDHHMMSS_description.sql
```

Example migration files:
- `20250101000000_initial_schema.sql` - Core tables and extensions
- `20250101000001_add_rls_policies.sql` - Row Level Security policies
- `20250101000002_create_functions.sql` - Database functions and triggers
- `20250101000003_add_indexes.sql` - Performance indexes

## Data Relationships

```
users (1) ──< (N) vehicles
  │               │
  │               ├──< (N) maintenance_records
  │               ├──< (N) diagnostic_codes
  │               ├──< (N) service_reminders
  │               └──< (1) financial_accounts
  │
  └──< (N) chat_sessions ──< (N) chat_messages

manuals (1) ──< (N) vector_embeddings
  │
  └──< (N) vehicles (reference)
```

## Performance Considerations

1. **Indexing Strategy**
   - B-tree indexes on foreign keys and frequently queried columns
   - GIN indexes on JSONB and array columns
   - ivfflat indexes on vector embeddings for similarity search

2. **Connection Pooling**
   - Supabase pgBouncer for efficient connection management
   - Transaction mode for short-lived connections

3. **Query Optimization**
   - Materialized views for complex analytics queries
   - Partial indexes for filtered queries
   - EXPLAIN ANALYZE for query plan analysis

4. **Archival Strategy**
   - Partition large tables (chat_messages, maintenance_records) by date
   - Archive old data to separate tables after 2 years
   - Maintain aggregated statistics for historical analysis

## Backup and Recovery

- **Automated Backups**: Daily full backups with 7-day retention
- **Point-in-Time Recovery**: 24-hour PITR window
- **Manual Backups**: Pre-deployment snapshots
- **Disaster Recovery**: Multi-region replication for production

## Security Best Practices

1. **Row Level Security**: Enabled on all user-accessible tables
2. **Encrypted Columns**: Use pgcrypto for sensitive financial data
3. **Audit Logging**: Track all data mutations with user context
4. **API Security**: JWT validation on all database access
5. **Rate Limiting**: Prevent abuse with Supabase rate limits
6. **SQL Injection Prevention**: Use parameterized queries only

## Conclusion

This schema provides a robust foundation for the Gear AI CoPilot application, supporting all core features while maintaining security, performance, and scalability. The use of pgvector enables advanced RAG capabilities, while RLS policies ensure strict data isolation between users.
