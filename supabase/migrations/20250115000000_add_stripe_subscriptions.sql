-- Migration: Add Stripe subscription support
-- Description: Creates tables and columns for Stripe subscription management
-- Created: 2025-01-15

-- ============================================================================
-- Add subscription-related columns to users table
-- ============================================================================

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- ============================================================================
-- Create subscriptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'none')),
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Add comment
COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription data for users';

-- ============================================================================
-- Create checkout_sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  price_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_session_id ON checkout_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);

-- Add comment
COMMENT ON TABLE checkout_sessions IS 'Tracks Stripe checkout sessions for subscription purchases';

-- ============================================================================
-- Create function to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for subscriptions table
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = (SELECT firebase_uid FROM users WHERE user_id = subscriptions.user_id));

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Checkout sessions policies
DROP POLICY IF EXISTS "Users can view their own checkout sessions" ON checkout_sessions;
CREATE POLICY "Users can view their own checkout sessions"
  ON checkout_sessions
  FOR SELECT
  USING (auth.uid() = (SELECT firebase_uid FROM users WHERE user_id = checkout_sessions.user_id));

DROP POLICY IF EXISTS "Service role can manage all checkout sessions" ON checkout_sessions;
CREATE POLICY "Service role can manage all checkout sessions"
  ON checkout_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON checkout_sessions TO authenticated;

-- Grant full access to service role
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON checkout_sessions TO service_role;

-- ============================================================================
-- Add helpful views (optional)
-- ============================================================================

-- View for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.*,
  u.email,
  u.tier,
  u.display_name
FROM subscriptions s
JOIN users u ON s.user_id = u.user_id
WHERE s.status IN ('active', 'trialing')
AND s.current_period_end > NOW();

-- Grant select on view
GRANT SELECT ON active_subscriptions TO service_role;

COMMENT ON VIEW active_subscriptions IS 'View of all currently active subscriptions with user details';
