# Gear AI CoPilot - Security & Compliance

## Overview

This document outlines the security architecture, compliance requirements, and best practices for Gear AI CoPilot. Given the sensitive nature of personal vehicle data, financial information, and location tracking, security is a foundational pillar of the platform.

## Security Architecture

### Defense in Depth Strategy

The application implements multiple layers of security:

```
┌─────────────────────────────────────────────┐
│  Layer 1: Client-Side Security              │
│  - Input validation                         │
│  - XSS prevention                           │
│  - Secure storage (Keychain/Keystore)       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Layer 2: Transport Security                │
│  - TLS 1.3                                  │
│  - Certificate pinning                      │
│  - Encrypted API requests                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Layer 3: Application Security              │
│  - JWT authentication                       │
│  - API rate limiting                        │
│  - Input sanitization                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Layer 4: Database Security                 │
│  - Row Level Security (RLS)                 │
│  - Encrypted columns                        │
│  - Audit logging                            │
└─────────────────────────────────────────────┘
```

## Authentication & Authorization

### 1. Firebase Authentication

**Identity Provider**: Firebase Auth serves as the primary identity provider.

**Supported Methods**:
- Email/Password with email verification
- Google OAuth 2.0
- Apple Sign In
- Multi-Factor Authentication (MFA) via SMS or authenticator app

**Implementation**:

```typescript
// services/auth-service.ts
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export async function signUpUser(email: string, password: string) {
  const auth = getAuth();
  
  // Validate password strength
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Send verification email
  await sendEmailVerification(userCredential.user);
  
  // Sync to Supabase
  await syncUserToSupabase(userCredential.user);
  
  return userCredential.user;
}
```

### 2. Row Level Security (RLS)

All user data in Supabase is protected by RLS policies.

**Example Policy**:

```sql
-- Users can only access their own vehicles
CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (
    auth.uid() = (
      SELECT firebase_uid 
      FROM public.users 
      WHERE user_id = vehicles.user_id
    )
  );
```

**Enforcement**:
- RLS is enabled on all user-accessible tables
- Policies checked on every query automatically
- No way to bypass RLS even with direct database access

### 3. JWT Token Management

**Token Lifecycle**:
1. User authenticates via Firebase
2. Firebase issues JWT token (1 hour expiration)
3. Token included in Authorization header for API requests
4. Supabase validates JWT signature and claims
5. Token auto-refreshes 5 minutes before expiration

**Token Structure**:

```typescript
interface JWTClaims {
  sub: string;        // User ID
  email: string;      // User email
  email_verified: boolean;
  firebase: {
    sign_in_provider: string;
  };
  iat: number;        // Issued at
  exp: number;        // Expiration
  aud: string;        // Audience
  iss: string;        // Issuer
}
```

## Data Protection

### 1. Encryption at Rest

**Database Encryption**:
- PostgreSQL transparent data encryption (TDE)
- Sensitive columns encrypted with pgcrypto
- AES-256-GCM encryption algorithm

**Encrypted Columns**:

```sql
-- Financial account numbers
CREATE TABLE public.financial_accounts (
  account_id UUID PRIMARY KEY,
  -- Encrypted column for account number
  account_number_encrypted BYTEA,
  encryption_key_id VARCHAR(50)
);

-- Encryption function
CREATE OR REPLACE FUNCTION encrypt_account_number(
  account_number VARCHAR,
  key TEXT
) RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(account_number, key);
END;
$$ LANGUAGE plpgsql;

-- Decryption function (restricted access)
CREATE OR REPLACE FUNCTION decrypt_account_number(
  encrypted_data BYTEA,
  key TEXT
) RETURNS VARCHAR AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, key);
END;
$$ LANGUAGE plpgsql;
```

**File Storage Encryption**:
- Supabase Storage uses AES-256 for all uploaded files
- Vehicle photos, receipts, and documents encrypted at rest
- Encryption keys rotated annually

### 2. Encryption in Transit

**TLS Configuration**:
- Minimum TLS 1.3 for all connections
- Strong cipher suites only (ECDHE-RSA-AES256-GCM-SHA384)
- Certificate pinning in mobile apps

**Implementation**:

```typescript
// Mobile app certificate pinning
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSPinnedDomains": {
            "api.supabase.co": {
              "NSIncludesSubdomains": true,
              "NSPinnedLeafIdentities": [
                {
                  "SPKI-SHA256-PIN": "your-certificate-hash"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 3. Personally Identifiable Information (PII)

**PII Data Classification**:

| Data Type | Classification | Storage | Access Control |
|-----------|---------------|---------|----------------|
| Email | PII | Encrypted | User only |
| VIN | PII | Hashed + Encrypted | User + Support |
| License Plate | PII | Encrypted | User only |
| Location History | Sensitive PII | Anonymized after 90 days | User only |
| Financial Data | Sensitive PII | Encrypted | User only |
| Photos | PII | Encrypted | User only |

**Data Minimization**:
- Only collect data necessary for features
- Allow users to delete data on demand
- Auto-delete inactive accounts after 2 years

**User Data Rights**:
- **Access**: Users can export all their data (JSON format)
- **Deletion**: Users can delete their account and all associated data
- **Portability**: Data export in machine-readable format
- **Correction**: Users can update incorrect information

## Input Validation & Sanitization

### 1. Client-Side Validation

```typescript
// utils/validators.ts
export function validateVIN(vin: string): boolean {
  // VIN must be exactly 17 characters
  if (vin.length !== 17) return false;
  
  // VIN cannot contain I, O, or Q
  if (/[IOQ]/.test(vin)) return false;
  
  // Validate check digit (position 9)
  return validateVINCheckDigit(vin);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '');
}
```

### 2. Server-Side Validation

All Edge Functions validate and sanitize inputs:

```typescript
// supabase/functions/decode-vin/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const { vin } = await req.json();
  
  // Validate VIN
  if (!vin || typeof vin !== 'string' || vin.length !== 17) {
    return new Response(
      JSON.stringify({ error: 'Invalid VIN' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Sanitize VIN (uppercase, remove spaces)
  const sanitizedVIN = vin.toUpperCase().replace(/\s/g, '');
  
  // Process VIN...
});
```

## API Security

### 1. Rate Limiting

**Supabase Edge Functions**:

```typescript
// Rate limiting middleware
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const rateLimits = {
  free: { requests: 100, window: 3600 },    // 100/hour
  pro: { requests: 1000, window: 3600 },    // 1000/hour
  dealer: { requests: 10000, window: 3600 }, // 10000/hour
};

async function checkRateLimit(userId: string, tier: string) {
  const limit = rateLimits[tier];
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - limit.window;
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_KEY')!
  );
  
  // Count requests in current window
  const { count } = await supabase
    .from('api_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', windowStart);
  
  if (count && count >= limit.requests) {
    throw new Error('Rate limit exceeded');
  }
  
  // Log request
  await supabase.from('api_requests').insert({
    user_id: userId,
    timestamp: now,
  });
}
```

### 2. CORS Configuration

```typescript
// Strict CORS policy
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://gearai.app' 
    : 'http://localhost:8081',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

### 3. SQL Injection Prevention

**Always use parameterized queries**:

```typescript
// ❌ NEVER do this
const { data } = await supabase
  .from('vehicles')
  .select('*')
  .eq('vin', userInput); // Safe with Supabase client

// ✅ For raw SQL, use parameterized queries
const { data } = await supabase.rpc('get_vehicle_by_vin', {
  vin_param: userInput
});
```

## Vulnerability Management

### 1. Dependency Scanning

**Automated Tools**:
- GitHub Dependabot for npm packages
- `npm audit` in CI/CD pipeline
- Snyk for vulnerability scanning

**Process**:
1. Dependabot creates PR for vulnerable packages
2. Security team reviews impact
3. Update applied within 48 hours (critical) or 7 days (high)
4. Regression testing before merge

### 2. Code Security Scanning

**Static Analysis**:
- ESLint with security rules
- TypeScript strict mode
- SonarQube for code quality and security

**Configuration**:

```json
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
  }
};
```

### 3. Penetration Testing

- Annual third-party penetration testing
- Quarterly internal security audits
- Bug bounty program (planned for Phase 2)

## Compliance

### 1. GDPR (General Data Protection Regulation)

**Requirements**:
- ✅ Data processing lawfulness
- ✅ Right to access (data export)
- ✅ Right to erasure (account deletion)
- ✅ Data portability (JSON export)
- ✅ Breach notification (72-hour SLA)
- ✅ Privacy by design
- ✅ Data Protection Impact Assessment (DPIA)

**Implementation**:

```typescript
// services/gdpr-service.ts
export async function exportUserData(userId: string): Promise<object> {
  // Export all user data in JSON format
  const [user, vehicles, maintenance, chat] = await Promise.all([
    supabase.from('users').select('*').eq('user_id', userId).single(),
    supabase.from('vehicles').select('*').eq('user_id', userId),
    supabase.from('maintenance_records').select('*').in('vehicle_id', vehicleIds),
    supabase.from('chat_sessions').select('*, chat_messages(*)').eq('user_id', userId),
  ]);
  
  return {
    user: user.data,
    vehicles: vehicles.data,
    maintenance: maintenance.data,
    chat: chat.data,
    exported_at: new Date().toISOString(),
  };
}

export async function deleteUserData(userId: string): Promise<void> {
  // Cascade delete via foreign keys
  await supabase.from('users').delete().eq('user_id', userId);
  
  // Log deletion for audit
  await supabase.from('audit_log').insert({
    action: 'user_deletion',
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}
```

### 2. CCPA (California Consumer Privacy Act)

**Requirements**:
- ✅ Disclosure of data collection
- ✅ Right to know (data access)
- ✅ Right to delete
- ✅ Right to opt-out of data sale (N/A - we don't sell data)
- ✅ Non-discrimination for exercising rights

**Privacy Notice**: See `/legal/privacy-policy.md`

### 3. PCI DSS (Payment Card Industry Data Security Standard)

**Compliance Strategy**:
- Use Stripe as payment processor (PCI Level 1 certified)
- Never store credit card numbers in our database
- Only store Stripe customer IDs and subscription metadata

**Stripe Integration Security**:

```typescript
// Never log or store card data
export async function createPaymentMethod(
  cardElement: any // Stripe Elements card
): Promise<string> {
  const stripe = await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);
  
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  // Only return payment method ID, not card details
  return paymentMethod.id;
}
```

### 4. SOC 2 Type II (Future Goal)

**Timeline**: Year 2 after launch

**Requirements**:
- Security controls documentation
- Availability monitoring (99.9% uptime)
- Processing integrity validation
- Confidentiality safeguards
- Privacy controls
- Independent audit

## Incident Response

### 1. Security Incident Response Plan

**Phases**:

1. **Detection**: Monitoring alerts trigger investigation
2. **Containment**: Isolate affected systems
3. **Eradication**: Remove threat and patch vulnerability
4. **Recovery**: Restore normal operations
5. **Post-Incident**: Document lessons learned

**Breach Notification Timeline**:
- **Internal**: Immediately notify security team
- **Leadership**: Within 2 hours
- **Users**: Within 72 hours (GDPR requirement)
- **Authorities**: Within 72 hours (if required by regulation)

### 2. Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 (Critical) | Data breach, system compromise | 15 minutes | Database exposed publicly |
| P1 (High) | Vulnerability actively exploited | 1 hour | XSS attack detected |
| P2 (Medium) | Potential vulnerability discovered | 4 hours | Outdated dependency with CVE |
| P3 (Low) | Security best practice violation | 24 hours | Missing security header |

### 3. Communication Plan

**Internal**:
- #security-incidents Slack channel
- Email to security@gearai.app
- Incident tracking in Jira

**External**:
- Status page updates (status.gearai.app)
- Email to affected users
- Public disclosure (if required)

## Security Monitoring

### 1. Logging & Audit Trail

**Logged Events**:
- Authentication attempts (success/failure)
- Data access (read sensitive tables)
- Data modifications (create/update/delete)
- API requests with rate limit tracking
- Security events (failed logins, suspicious activity)

**Log Retention**: 1 year for audit, 7 days for operational logs

**Implementation**:

```sql
-- Audit log table
CREATE TABLE public.audit_log (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Trigger for sensitive table access
CREATE OR REPLACE FUNCTION log_financial_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, resource_type, resource_id)
  VALUES (
    (SELECT user_id FROM public.users WHERE firebase_uid = auth.uid()),
    TG_OP,
    'financial_account',
    NEW.account_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_financial_access
AFTER SELECT OR UPDATE OR DELETE ON public.financial_accounts
FOR EACH ROW EXECUTE FUNCTION log_financial_access();
```

### 2. Anomaly Detection

**Monitored Metrics**:
- Failed login attempts (>5 in 15 minutes)
- Unusual API usage patterns
- Large data exports
- Geolocation anomalies (login from different country)
- Repeated sensitive data access

**Alerting**:
- PagerDuty for critical alerts
- Slack notifications for warnings
- Weekly security reports

## Secure Development Lifecycle

### 1. Code Review Requirements

- All code reviewed by at least one peer
- Security-sensitive code reviewed by security team
- No merge without approval
- Automated security checks in CI/CD

### 2. Security Training

- Annual security awareness training for all developers
- Secure coding practices workshop
- OWASP Top 10 training
- Phishing simulation exercises

### 3. Secrets Management

**Never commit secrets to version control**:

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

**Use environment variables**:

```typescript
// ✅ Correct
const apiKey = process.env.OPENAI_API_KEY;

// ❌ Never do this
const apiKey = 'sk-proj-abc123...';
```

**Secret Rotation**:
- API keys rotated quarterly
- Database passwords rotated annually
- Encryption keys rotated annually
- Stripe webhook secrets rotated on suspected compromise

## Conclusion

Security is an ongoing process, not a one-time implementation. This security framework provides a strong foundation, but continuous monitoring, testing, and improvement are essential to protect user data and maintain trust in the Gear AI CoPilot platform.

**Security Contact**: security@gearai.app  
**Vulnerability Reporting**: See SECURITY.md in repository root
