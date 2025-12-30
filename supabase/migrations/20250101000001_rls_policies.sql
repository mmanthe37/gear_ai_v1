-- Gear AI CoPilot - Row Level Security (RLS) Policies
-- Version: 20250101000001
-- Description: Enable RLS and create security policies for all tables

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;

-- Manuals are read-only public data, no RLS needed
-- Vector embeddings are accessed via functions, not direct queries
-- Audit log is admin-only

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = firebase_uid);

-- Users can update their own profile (except tier and subscription fields)
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = firebase_uid)
  WITH CHECK (
    auth.uid() = firebase_uid AND
    -- Prevent users from changing their tier or subscription status
    tier = (SELECT tier FROM public.users WHERE firebase_uid = auth.uid()) AND
    subscription_status = (SELECT subscription_status FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Users are created via Firebase Auth sync (service role only)
CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- VEHICLES TABLE POLICIES
-- ============================================================================

-- Users can view their own vehicles
CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Users can insert vehicles (with tier-based limits enforced at app level)
CREATE POLICY "Users can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Users can update their own vehicles
CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Users can delete their own vehicles
CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- ============================================================================
-- MAINTENANCE RECORDS POLICIES
-- ============================================================================

-- Users can view maintenance records for their vehicles
CREATE POLICY "Users can view their vehicle maintenance"
  ON public.maintenance_records FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can insert maintenance records for their vehicles
CREATE POLICY "Users can insert maintenance for their vehicles"
  ON public.maintenance_records FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can update their maintenance records
CREATE POLICY "Users can update their maintenance records"
  ON public.maintenance_records FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can delete their maintenance records
CREATE POLICY "Users can delete their maintenance records"
  ON public.maintenance_records FOR DELETE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- ============================================================================
-- FINANCIAL ACCOUNTS POLICIES
-- ============================================================================

-- Users can view financial accounts for their vehicles
CREATE POLICY "Users can view their vehicle finances"
  ON public.financial_accounts FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can insert financial accounts for their vehicles
CREATE POLICY "Users can insert financial accounts for their vehicles"
  ON public.financial_accounts FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can update their financial accounts
CREATE POLICY "Users can update their financial accounts"
  ON public.financial_accounts FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can delete their financial accounts
CREATE POLICY "Users can delete their financial accounts"
  ON public.financial_accounts FOR DELETE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- ============================================================================
-- DIAGNOSTIC CODES POLICIES
-- ============================================================================

-- Users can view diagnostic codes for their vehicles
CREATE POLICY "Users can view their vehicle diagnostics"
  ON public.diagnostic_codes FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can insert diagnostic codes (typically from OBD scanner)
CREATE POLICY "Users can insert diagnostics for their vehicles"
  ON public.diagnostic_codes FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can update diagnostic codes (e.g., mark as resolved)
CREATE POLICY "Users can update their diagnostic codes"
  ON public.diagnostic_codes FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can delete diagnostic codes
CREATE POLICY "Users can delete their diagnostic codes"
  ON public.diagnostic_codes FOR DELETE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- ============================================================================
-- CHAT SESSIONS POLICIES
-- ============================================================================

-- Users can view their own chat sessions
CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Users can insert their own chat sessions
CREATE POLICY "Users can insert their own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Users can update their own chat sessions
CREATE POLICY "Users can update their own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- ============================================================================
-- CHAT MESSAGES POLICIES
-- ============================================================================

-- Users can view messages in their sessions
CREATE POLICY "Users can view messages in their sessions"
  ON public.chat_messages FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM public.chat_sessions 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can insert messages in their sessions
CREATE POLICY "Users can insert messages in their sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM public.chat_sessions 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Messages are typically not updated or deleted (append-only log)
-- But allow deletion for GDPR compliance
CREATE POLICY "Users can delete messages in their sessions"
  ON public.chat_messages FOR DELETE
  USING (
    session_id IN (
      SELECT session_id FROM public.chat_sessions 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- ============================================================================
-- SERVICE REMINDERS POLICIES
-- ============================================================================

-- Users can view reminders for their vehicles
CREATE POLICY "Users can view their vehicle reminders"
  ON public.service_reminders FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can insert reminders for their vehicles
CREATE POLICY "Users can insert reminders for their vehicles"
  ON public.service_reminders FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can update their reminders
CREATE POLICY "Users can update their reminders"
  ON public.service_reminders FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- Users can delete their reminders
CREATE POLICY "Users can delete their reminders"
  ON public.service_reminders FOR DELETE
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM public.vehicles 
      WHERE user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
    )
  );

-- ============================================================================
-- API REQUESTS LOG POLICIES
-- ============================================================================

ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own API request history
CREATE POLICY "Users can view their own API requests"
  ON public.api_requests FOR SELECT
  USING (
    user_id = (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid())
  );

-- Service role can insert API request logs
CREATE POLICY "Service role can log API requests"
  ON public.api_requests FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Auto-cleanup policy (service role only)
CREATE POLICY "Service role can cleanup old API requests"
  ON public.api_requests FOR DELETE
  USING (
    auth.jwt()->>'role' = 'service_role' AND
    timestamp < NOW() - INTERVAL '24 hours'
  );

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if user owns a vehicle
CREATE OR REPLACE FUNCTION user_owns_vehicle(p_vehicle_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vehicles v
    INNER JOIN public.users u ON v.user_id = u.user_id
    WHERE v.vehicle_id = p_vehicle_id AND u.firebase_uid = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT tier FROM public.users WHERE firebase_uid = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check tier-based vehicle limits
CREATE OR REPLACE FUNCTION can_add_vehicle()
RETURNS BOOLEAN AS $$
DECLARE
  user_tier VARCHAR;
  vehicle_count INT;
BEGIN
  -- Get user tier
  user_tier := get_user_tier();
  
  -- Count current vehicles
  vehicle_count := (
    SELECT COUNT(*) FROM public.vehicles v
    INNER JOIN public.users u ON v.user_id = u.user_id
    WHERE u.firebase_uid = auth.uid() AND v.is_active = true
  );
  
  -- Check limits
  RETURN CASE
    WHEN user_tier = 'free' THEN vehicle_count < 1
    WHEN user_tier = 'pro' THEN vehicle_count < 3
    ELSE true -- mechanic and dealer have unlimited
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view their own profile" ON public.users IS 
  'Users can only view their own user profile';

COMMENT ON POLICY "Users can view their own vehicles" ON public.vehicles IS 
  'Users can only view vehicles they own';

COMMENT ON FUNCTION user_owns_vehicle(UUID) IS 
  'Helper function to check if the authenticated user owns a specific vehicle';

COMMENT ON FUNCTION get_user_tier() IS 
  'Returns the subscription tier of the authenticated user';

COMMENT ON FUNCTION can_add_vehicle() IS 
  'Checks if user can add more vehicles based on their subscription tier';
