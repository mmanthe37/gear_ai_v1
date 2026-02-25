# Stripe Subscription Implementation

This document describes the complete Stripe subscription system implementation for Gear AI CoPilot.

## Overview

The system implements a three-tier subscription model:
- **FREE**: 1 vehicle, basic features
- **PRO** ($9.99/mo): 5 vehicles, OCR, AI chat, 7-day trial
- **PREMIUM** ($19.99/mo): Unlimited vehicles, OBD-II diagnostics, priority support

## Architecture

### Backend (Vercel Serverless Functions)

#### `api/stripe/create-checkout.ts`
Creates Stripe checkout sessions for new subscriptions.
- Creates or retrieves Stripe customer
- Creates checkout session with 7-day trial
- Stores session in Supabase for tracking

#### `api/stripe/webhook.ts`
Handles Stripe webhook events:
- `checkout.session.completed`: Updates session status
- `customer.subscription.created/updated`: Updates user tier and subscription status
- `customer.subscription.deleted`: Downgrades user to free tier
- `invoice.payment_succeeded/failed`: Updates payment status

**Security**: Verifies webhook signatures using `STRIPE_WEBHOOK_SECRET`

#### `api/stripe/create-portal-session.ts`
Creates customer portal sessions for subscription management.
- Allows users to update payment methods
- View invoices
- Cancel subscriptions

### Frontend

#### Services

**`services/subscription-service.ts`**
- `createCheckoutSession()`: Initiates checkout flow
- `cancelSubscription()`: Cancels active subscription
- `updateSubscriptionTier()`: Changes subscription tier
- `getSubscriptionStatus()`: Retrieves user subscription details
- `checkFeatureAccess()`: Validates feature access
- `checkVehicleLimit()`: Validates vehicle count against tier limits
- `createPortalSession()`: Opens billing portal
- `isInTrialPeriod()`: Checks trial status

#### Hooks

**`hooks/useFeatureAccess.ts`**
- `useFeatureAccess()`: React hook for feature gating
- `useVehicleLimit()`: React hook for vehicle count validation

#### Screens

**`app/subscription/plans.tsx`**
- Displays all subscription tiers
- Handles upgrade flow
- Shows current plan status
- Opens Stripe checkout in browser

**`app/subscription/manage.tsx`**
- Shows current subscription details
- Next billing date
- Trial status
- Opens customer portal
- Upgrade option

**`app/subscription/success.tsx`**
- Confirmation screen after successful checkout
- Displays trial information
- Navigation to app features

#### Components

**Updated `components/AddVehicleModal.tsx`**
- Vehicle limit warning
- Upgrade prompt when limit reached
- Disabled state when over limit

**Updated `app/(tabs)/index.tsx`**
- Vehicle count check before showing modal
- Alert with upgrade option on limit reached
- Integration with `useVehicleLimit` hook

## Environment Variables

### Client-side (EXPO_PUBLIC_*)
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_APP_URL=https://yourapp.com
```

### Server-side (Vercel)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=eyJ...
```

## Database Schema

### Users Table Updates
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP;
```

### Subscriptions Table (New)
```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

### Checkout Sessions Table (New)
```sql
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  price_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_checkout_sessions_session_id ON checkout_sessions(session_id);
CREATE INDEX idx_checkout_sessions_user_id ON checkout_sessions(user_id);
```

## Stripe Dashboard Setup

### 1. Create Products and Prices
In Stripe Dashboard:
1. Navigate to Products → Add Product
2. Create "Pro" and "Premium" products
3. Add monthly and yearly pricing
4. Enable free trial for Pro (7 days)
5. Copy price IDs to environment variables

### 2. Configure Webhooks
1. Navigate to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Configure Customer Portal
1. Navigate to Settings → Customer Portal
2. Enable features:
   - Update payment method
   - View invoices
   - Cancel subscription
3. Set cancellation policy (immediate or end of period)

## Testing

### Test Mode
Use test mode API keys during development:
```env
STRIPE_SECRET_KEY=sk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Webhook Testing
Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Security Considerations

### ✅ Implemented
- Webhook signature verification
- Server-side price validation
- Environment variable separation (EXPO_PUBLIC_* vs server-side)
- Stripe customer ID stored securely in database
- No sensitive keys in client code

### ⚠️ Important
- Never expose `STRIPE_SECRET_KEY` in client code
- Always verify amounts server-side
- Use HTTPS for production webhooks
- Implement rate limiting on API endpoints
- Log all subscription changes for audit trail

## User Flow

### Upgrade Flow
1. User clicks "Upgrade" in app
2. App calls `createCheckoutSession()`
3. Checkout URL opens in browser
4. User completes payment
5. Stripe sends webhook → `checkout.session.completed`
6. Webhook handler updates user tier in database
7. User redirected to success screen
8. App refreshes subscription status

### Cancellation Flow
1. User clicks "Manage Billing"
2. App calls `createPortalSession()`
3. Portal opens in browser
4. User cancels subscription
5. Stripe sends webhook → `customer.subscription.deleted`
6. Webhook handler downgrades user to free tier
7. Access continues until period end (if configured)

## Feature Gating

### Example Usage
```typescript
import { useVehicleLimit } from '../hooks/useFeatureAccess';

const { canAdd, limit, tierRequired } = useVehicleLimit(userId, vehicleCount);

if (!canAdd) {
  Alert.alert(
    'Upgrade Required',
    `Upgrade to ${tierRequired} to add more vehicles`
  );
}
```

### Tier Limits
```typescript
const SubscriptionTiers = {
  free: { max_vehicles: 1 },
  pro: { max_vehicles: 5 },
  premium: { max_vehicles: 'unlimited' }
};
```

## Monitoring

### Key Metrics to Track
- Conversion rate (free → paid)
- Trial conversion rate
- Churn rate
- MRR (Monthly Recurring Revenue)
- Failed payments
- Webhook delivery success

### Stripe Dashboard
Monitor in real-time:
- Active subscriptions
- Revenue
- Failed payments
- Customer lifetime value

## Troubleshooting

### Webhook not firing
1. Check webhook secret is correct
2. Verify endpoint is publicly accessible
3. Check Stripe webhook logs in dashboard
4. Test with Stripe CLI

### Payment fails
1. Check card details
2. Verify price IDs are correct
3. Check Stripe logs for errors
4. Ensure test mode matches environment

### Subscription not updating
1. Check webhook handler logs
2. Verify database permissions
3. Check Supabase service key
4. Review webhook event payload

## Future Enhancements

- [ ] Proration for mid-cycle upgrades/downgrades
- [ ] Annual subscription discounts
- [ ] Family/team plans
- [ ] Gift subscriptions
- [ ] Referral program with discounts
- [ ] Usage-based billing for API tier
- [ ] Integration with analytics platforms
- [ ] Automated dunning for failed payments
- [ ] Custom subscription intervals

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Testing Stripe](https://stripe.com/docs/testing)
