-- Gear AI CoPilot - Initial Schema Migration
-- Version: 20250101000000
-- Description: Create core tables and enable pgvector extension

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
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
  preferences JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_firebase_uid ON public.users(firebase_uid);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);

-- ============================================================================
-- MANUALS TABLE
-- ============================================================================
CREATE TABLE public.manuals (
  manual_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL CHECK (year >= 1900 AND year <= 2100),
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

CREATE INDEX idx_manuals_make_model_year ON public.manuals(make, model, year);
CREATE INDEX idx_manuals_processing_status ON public.manuals(processing_status);

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
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
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_vin CHECK (LENGTH(vin) = 17)
);

CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_vin ON public.vehicles(vin);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX idx_vehicles_year ON public.vehicles(year);
CREATE INDEX idx_vehicles_is_active ON public.vehicles(is_active) WHERE is_active = true;

-- ============================================================================
-- VECTOR EMBEDDINGS TABLE (for RAG)
-- ============================================================================
CREATE TABLE public.vector_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manual_id UUID REFERENCES public.manuals(manual_id) ON DELETE CASCADE NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INT NOT NULL,
  parent_chunk_id UUID REFERENCES public.vector_embeddings(embedding_id),
  page_number INT,
  section_title VARCHAR(255),
  embedding vector(768), -- e5-base-v2 dimension
  token_count INT,
  chunk_type VARCHAR(50) CHECK (chunk_type IN ('parent', 'child')) DEFAULT 'child',
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_embeddings_manual_id ON public.vector_embeddings(manual_id);
CREATE INDEX idx_embeddings_chunk_index ON public.vector_embeddings(chunk_index);
CREATE INDEX idx_embeddings_parent_chunk ON public.vector_embeddings(parent_chunk_id) WHERE parent_chunk_id IS NOT NULL;

-- Vector similarity index (ivfflat)
-- Note: This index should be created AFTER populating data for better performance
-- CREATE INDEX idx_embeddings_vector ON public.vector_embeddings 
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- ============================================================================
-- MAINTENANCE RECORDS TABLE
-- ============================================================================
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
  dtc_codes TEXT[],
  parts_replaced TEXT[],
  attachment_urls TEXT[],
  next_service_date DATE,
  next_service_mileage INT,
  warranty_covered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_maintenance_vehicle_id ON public.maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_date ON public.maintenance_records(date DESC);
CREATE INDEX idx_maintenance_type ON public.maintenance_records(type);
CREATE INDEX idx_maintenance_dtc_codes ON public.maintenance_records USING GIN(dtc_codes);

-- ============================================================================
-- FINANCIAL ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE public.financial_accounts (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('loan', 'lease', 'cash')) NOT NULL,
  lender_name VARCHAR(100),
  account_number_encrypted BYTEA, -- Encrypted account number
  encryption_key_id VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE,
  term_months INT,
  interest_rate DECIMAL(5, 4),
  money_factor DECIMAL(7, 6),
  residual_value DECIMAL(10, 2),
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

CREATE INDEX idx_financial_vehicle_id ON public.financial_accounts(vehicle_id);
CREATE INDEX idx_financial_type ON public.financial_accounts(type);
CREATE INDEX idx_financial_status ON public.financial_accounts(status);

-- ============================================================================
-- DIAGNOSTIC CODES TABLE
-- ============================================================================
CREATE TABLE public.diagnostic_codes (
  diagnostic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(10) NOT NULL,
  code_type VARCHAR(10) CHECK (code_type IN ('P', 'C', 'B', 'U')),
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

CREATE INDEX idx_diagnostic_vehicle_id ON public.diagnostic_codes(vehicle_id);
CREATE INDEX idx_diagnostic_code ON public.diagnostic_codes(code);
CREATE INDEX idx_diagnostic_status ON public.diagnostic_codes(status);
CREATE INDEX idx_diagnostic_severity ON public.diagnostic_codes(severity);
CREATE INDEX idx_diagnostic_detected ON public.diagnostic_codes(detected_at DESC);

-- ============================================================================
-- CHAT SESSIONS TABLE
-- ============================================================================
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

CREATE INDEX idx_chat_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_vehicle_id ON public.chat_sessions(vehicle_id);
CREATE INDEX idx_chat_started_at ON public.chat_sessions(started_at DESC);
CREATE INDEX idx_chat_is_active ON public.chat_sessions(is_active) WHERE is_active = true;

-- ============================================================================
-- CHAT MESSAGES TABLE
-- ============================================================================
CREATE TABLE public.chat_messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INT,
  model_version VARCHAR(50),
  retrieval_context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_messages_role ON public.chat_messages(role);

-- ============================================================================
-- SERVICE REMINDERS TABLE
-- ============================================================================
CREATE TABLE public.service_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  service_type VARCHAR(100) NOT NULL,
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

CREATE INDEX idx_reminders_vehicle_id ON public.service_reminders(vehicle_id);
CREATE INDEX idx_reminders_due_date ON public.service_reminders(due_date);
CREATE INDEX idx_reminders_status ON public.service_reminders(status);
CREATE INDEX idx_reminders_priority ON public.service_reminders(priority);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE public.audit_log (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON public.audit_log(timestamp DESC);
CREATE INDEX idx_audit_action ON public.audit_log(action);
CREATE INDEX idx_audit_resource ON public.audit_log(resource_type, resource_id);

-- ============================================================================
-- API CACHE TABLE (for rate limiting and caching)
-- ============================================================================
CREATE TABLE public.api_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);

-- ============================================================================
-- API REQUESTS LOG (for rate limiting tracking)
-- ============================================================================
CREATE TABLE public.api_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_requests_user_timestamp ON public.api_requests(user_id, timestamp DESC);

-- Auto-cleanup old API requests (older than 24 hours)
CREATE INDEX idx_api_requests_cleanup ON public.api_requests(timestamp) 
  WHERE timestamp < NOW() - INTERVAL '24 hours';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manuals_updated_at BEFORE UPDATE ON public.manuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_updated_at BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnostic_updated_at BEFORE UPDATE ON public.diagnostic_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.service_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_login_at on users table when firebase_uid is accessed
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_login_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions to authenticated users
-- Note: Specific RLS policies will be added in the next migration
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Lock down audit_log so it is not broadly accessible to authenticated/anon clients
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.audit_log FROM authenticated, anon;

-- Allow only trusted backend/admin role to manage audit_log
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_log TO service_role;
-- Grant read-only access to anonymous users for manuals
GRANT SELECT ON public.manuals TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User accounts and subscription information';
COMMENT ON TABLE public.vehicles IS 'Vehicle records with VIN-decoded specifications';
COMMENT ON TABLE public.manuals IS 'Owner manual documents and metadata';
COMMENT ON TABLE public.vector_embeddings IS 'Chunked manual content with embeddings for RAG';
COMMENT ON TABLE public.maintenance_records IS 'Service and repair history';
COMMENT ON TABLE public.financial_accounts IS 'Loan and lease tracking';
COMMENT ON TABLE public.diagnostic_codes IS 'OBD-II trouble codes and analysis';
COMMENT ON TABLE public.chat_sessions IS 'AI chat conversation sessions';
COMMENT ON TABLE public.chat_messages IS 'Individual chat messages';
COMMENT ON TABLE public.service_reminders IS 'Automated maintenance reminders';
COMMENT ON TABLE public.audit_log IS 'Security and compliance audit trail';
