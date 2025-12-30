# Gear AI CoPilot - API Integration Guide

## Overview

This document details the third-party API integrations that power Gear AI CoPilot's features. Each integration is categorized by functional area and includes authentication methods, rate limits, and implementation guidelines.

## API Categories

### 1. Vehicle Identity & Data
### 2. Diagnostics & Maintenance
### 3. Market Intelligence & Valuation
### 4. AI & Machine Learning
### 5. Payments & Subscriptions
### 6. Location & Maps
### 7. Parts & Customization

---

## 1. Vehicle Identity & Data

### 1.1 NHTSA vPIC API

**Purpose**: VIN decoding and vehicle specifications

**Base URL**: `https://vpic.nhtsa.dot.gov/api/`

**Authentication**: None (Public API)

**Rate Limits**: No official limits, but use responsibly

**Key Endpoints**:

```typescript
// Decode VIN
GET /vehicles/DecodeVin/{VIN}?format=json&modelyear={YEAR}

// Response example
{
  "Count": 136,
  "Message": "Results returned successfully...",
  "SearchCriteria": "VIN:1HGBH41JXMN109186",
  "Results": [
    {
      "Value": "Honda",
      "ValueId": "26",
      "Variable": "Make",
      "VariableId": 26
    },
    {
      "Value": "Accord",
      "ValueId": "28", 
      "Variable": "Model",
      "VariableId": 28
    }
    // ... 134 more fields
  ]
}
```

**Implementation**:

```typescript
// services/vin-decoder.ts
export interface VehicleData {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engineDisplacement?: number;
  engineCylinders?: number;
  fuelType?: string;
  // ... more fields
}

export async function decodeVIN(vin: string, year?: number): Promise<VehicleData> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json${year ? `&modelyear=${year}` : ''}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.Message.includes('successfully')) {
    return parseNHTSAResponse(data.Results);
  }
  
  throw new Error('Failed to decode VIN');
}

function parseNHTSAResponse(results: any[]): VehicleData {
  const getValue = (variableId: number) => 
    results.find(r => r.VariableId === variableId)?.Value || null;
  
  return {
    vin: getValue(143), // Error Code check
    year: parseInt(getValue(29)),
    make: getValue(26),
    model: getValue(28),
    trim: getValue(38) || getValue(109), // Trim or Trim2
    engineDisplacement: parseFloat(getValue(13)),
    engineCylinders: parseInt(getValue(9)),
    fuelType: getValue(24),
  };
}
```

### 1.2 CARFAX/AutoCheck API

**Purpose**: Vehicle history reports, service records

**Authentication**: API Key

**Rate Limits**: Varies by subscription tier

**Pricing**: ~$0.50-2.00 per VIN lookup

**Key Endpoints**:

```typescript
// Get vehicle history
POST /api/v1/vehicle-history

// Request body
{
  "vin": "1HGBH41JXMN109186",
  "product": "full_report"
}

// Response includes:
// - Accident history
// - Service records
// - Ownership history
// - Recall information
```

---

## 2. Diagnostics & Maintenance

### 2.1 CarMD API

**Purpose**: DTC (Diagnostic Trouble Code) information and repair costs

**Base URL**: `https://api.carmd.com/v3.0/`

**Authentication**: Partner Token + Authorization Header

**Rate Limits**: 5,000 requests/month (Pro tier)

**Key Endpoints**:

```typescript
// Decode diagnostic code
GET /diag?vin={VIN}&mileage={MILEAGE}&dtc={CODE}

// Request headers
{
  "content-type": "application/json",
  "partner-token": "YOUR_PARTNER_TOKEN",
  "authorization": "Basic YOUR_AUTH_TOKEN"
}

// Response
{
  "message": {
    "code": 0,
    "message": "ok",
    "credentials": "valid",
    "version": "v3.0.0",
    "endpoint": "diag",
    "counter": 1
  },
  "data": {
    "desc": "Catalyst System Efficiency Below Threshold (Bank 1)",
    "urgency": {
      "code": 2,
      "desc": "Not Urgent"
    },
    "tsb": [/* Technical Service Bulletins */],
    "labor_cost": 150.00,
    "parts_cost": 1200.00,
    "total_cost": 1350.00
  }
}
```

**Implementation**:

```typescript
// services/diagnostic-service.ts
export interface DTCAnalysis {
  code: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedCostMin: number;
  estimatedCostMax: number;
  laborCost: number;
  partsCost: number;
  techServiceBulletins: string[];
}

export async function analyzeDTC(
  vin: string,
  code: string,
  mileage: number
): Promise<DTCAnalysis> {
  const response = await fetch(
    `https://api.carmd.com/v3.0/diag?vin=${vin}&mileage=${mileage}&dtc=${code}`,
    {
      headers: {
        'content-type': 'application/json',
        'partner-token': process.env.CARMD_PARTNER_TOKEN!,
        'authorization': `Basic ${process.env.CARMD_AUTH_TOKEN!}`,
      },
    }
  );
  
  const data = await response.json();
  
  return {
    code,
    description: data.data.desc,
    urgency: mapUrgency(data.data.urgency.code),
    estimatedCostMin: data.data.labor_cost,
    estimatedCostMax: data.data.total_cost,
    laborCost: data.data.labor_cost,
    partsCost: data.data.parts_cost,
    techServiceBulletins: data.data.tsb || [],
  };
}
```

### 2.2 RepairPal API

**Purpose**: Local repair cost estimates

**Authentication**: API Key

**Key Features**:
- Location-based cost estimates
- Shop recommendations
- Service descriptions

---

## 3. Market Intelligence & Valuation

### 3.1 MarketCheck API

**Purpose**: Real-time vehicle listings and market valuations

**Base URL**: `https://mc-api.marketcheck.com/v2/`

**Authentication**: API Key (Header: `api_key`)

**Rate Limits**: 1,000 requests/day (Basic tier)

**Key Endpoints**:

```typescript
// Get average market price
GET /predict/car/price?vin={VIN}

// Search similar listings
GET /search/car/active?year={YEAR}&make={MAKE}&model={MODEL}&miles={MILES}

// Response
{
  "listings": [
    {
      "id": "xyz123",
      "vin": "1HGBH41JXMN109186",
      "price": 25495,
      "miles": 45000,
      "dealer": {
        "name": "AutoNation Honda",
        "city": "San Francisco",
        "state": "CA"
      }
    }
  ],
  "total": 143,
  "average_price": 24500
}
```

### 3.2 Black Book API

**Purpose**: Wholesale and auction valuations

**Authentication**: API Key + OAuth 2.0

**Use Case**: Trade-in value estimation

**Key Endpoints**:

```typescript
// Get trade-in value
GET /UsedVehicleSearch/GetUsedCarValue

// Parameters
{
  "vin": "1HGBH41JXMN109186",
  "mileage": 45000,
  "condition": "good", // excellent, good, fair, poor
  "region": "pacific"
}

// Response
{
  "trade_in_clean": 22000,
  "trade_in_average": 20500,
  "trade_in_rough": 18000,
  "wholesale_average": 21000
}
```

**Implementation**:

```typescript
// services/valuation-service.ts
export interface VehicleValuation {
  currentMarketValue: number;
  tradeInValue: number;
  privatePartyValue: number;
  dealerRetailValue: number;
  wholesaleValue: number;
  confidenceLevel: number;
  dataSource: string;
  lastUpdated: Date;
}

export async function getVehicleValue(
  vin: string,
  mileage: number,
  condition: 'excellent' | 'good' | 'fair' | 'poor' = 'good'
): Promise<VehicleValuation> {
  // Combine MarketCheck (retail) and Black Book (wholesale) data
  const [marketData, blackBookData] = await Promise.all([
    fetchMarketCheckValue(vin),
    fetchBlackBookValue(vin, mileage, condition),
  ]);
  
  return {
    currentMarketValue: marketData.average_price,
    tradeInValue: blackBookData.trade_in_average,
    privatePartyValue: marketData.average_price * 0.95, // Estimate
    dealerRetailValue: marketData.average_price,
    wholesaleValue: blackBookData.wholesale_average,
    confidenceLevel: 0.85,
    dataSource: 'MarketCheck + Black Book',
    lastUpdated: new Date(),
  };
}
```

---

## 4. AI & Machine Learning

### 4.1 OpenAI API

**Purpose**: Conversational AI, RAG, text generation

**Base URL**: `https://api.openai.com/v1/`

**Authentication**: Bearer Token

**Rate Limits**: Varies by tier (TPM/RPM)

**Cost**: ~$0.01-0.06 per 1K tokens

**Key Endpoints**:

```typescript
// Chat Completions
POST /chat/completions

// Request
{
  "model": "gpt-4-turbo-preview",
  "messages": [
    {
      "role": "system",
      "content": "You are an automotive expert assistant..."
    },
    {
      "role": "user",
      "content": "What does error code P0420 mean for my 2023 Honda Accord?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}

// Embeddings (for RAG)
POST /embeddings

{
  "model": "text-embedding-3-small",
  "input": "Check engine light procedure for 2023 Honda Accord"
}
```

**Implementation**:

```typescript
// services/ai-service.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateAIResponse(
  messages: Array<{ role: string; content: string }>,
  context?: string
): Promise<string> {
  const systemMessage = {
    role: 'system',
    content: `You are Gear AI, an expert automotive assistant. ${context || ''}`,
  };
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 800,
  });
  
  return completion.choices[0].message.content || '';
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}
```

### 4.2 Hugging Face Inference API

**Purpose**: Custom ML models (YOLOv8 damage detection, reranking)

**Base URL**: `https://api-inference.huggingface.co/`

**Authentication**: Bearer Token

**Key Endpoints**:

```typescript
// Image classification (damage detection)
POST /models/YOUR_USERNAME/car-damage-detection

// Request (multipart/form-data)
FormData with image file

// Response
[
  { "label": "dent", "score": 0.92 },
  { "label": "scratch", "score": 0.45 }
]
```

---

## 5. Payments & Subscriptions

### 5.1 Stripe API

**Purpose**: Payment processing, subscription management

**Base URL**: `https://api.stripe.com/v1/`

**Authentication**: Bearer Token (Secret Key)

**Key Endpoints**:

```typescript
// Create customer
POST /customers

// Create subscription
POST /subscriptions

// Request
{
  "customer": "cus_xyz123",
  "items": [
    {
      "price": "price_pro_monthly"
    }
  ],
  "metadata": {
    "user_id": "user_uuid_here"
  }
}

// Webhook events
POST /webhook_endpoint

// Event types to handle:
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.payment_succeeded
// - invoice.payment_failed
```

**Implementation**:

```typescript
// services/subscription-service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createSubscription(
  userId: string,
  email: string,
  priceId: string
): Promise<{ subscriptionId: string; clientSecret: string }> {
  // Create or retrieve customer
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });
  
  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
  
  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret!,
  };
}
```

---

## 6. Location & Maps

### 6.1 Google Places API

**Purpose**: Service shop locator, reviews

**Base URL**: `https://maps.googleapis.com/maps/api/place/`

**Authentication**: API Key

**Rate Limits**: ~$200 free credit/month

**Key Endpoints**:

```typescript
// Nearby search
GET /nearbysearch/json?location={LAT},{LNG}&radius=8000&type=car_repair&key={API_KEY}

// Response
{
  "results": [
    {
      "name": "Joe's Auto Repair",
      "rating": 4.7,
      "user_ratings_total": 342,
      "vicinity": "123 Main St, San Francisco",
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4"
    }
  ]
}
```

### 6.2 Mapbox API

**Purpose**: EV charging station locator

**Base URL**: `https://api.mapbox.com/`

**Authentication**: Access Token

**Key Features**:
- Real-time charging availability
- Connector type filtering (J1772, CCS, Tesla)
- Navigation integration

---

## 7. Parts & Customization

### 7.1 SEMA Data API

**Purpose**: Aftermarket parts fitment and catalog

**Base URL**: `https://api.semadata.org/`

**Authentication**: API Key + Dataset License

**Standards**: ACES (fitment) + PIES (product info)

**Key Endpoints**:

```typescript
// Get parts by ACES vehicle
GET /v1/parts?year={YEAR}&make={MAKE}&model={MODEL}&submodel={TRIM}

// Response
{
  "parts": [
    {
      "part_number": "K&N-99-5050",
      "brand": "K&N",
      "description": "Cold Air Intake System",
      "category": "Air Intake",
      "fitment": "Universal",
      "price_msrp": 349.99
    }
  ]
}
```

---

## API Security Best Practices

### 1. Environment Variables

```bash
# .env.local
NHTSA_API_URL=https://vpic.nhtsa.dot.gov/api/
CARMD_PARTNER_TOKEN=your_partner_token
CARMD_AUTH_TOKEN=your_auth_token
MARKETCHECK_API_KEY=your_api_key
BLACKBOOK_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
GOOGLE_PLACES_API_KEY=your_api_key
```

### 2. Rate Limiting

Implement client-side rate limiting to avoid hitting API limits:

```typescript
// utils/rate-limiter.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async throttle(key: string, limit: number, window: number): Promise<void> {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < window);
    
    if (validTimestamps.length >= limit) {
      const oldestTimestamp = validTimestamps[0];
      const waitTime = window - (now - oldestTimestamp);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
  }
}

export const rateLimiter = new RateLimiter();
```

### 3. Error Handling

```typescript
// utils/api-error-handler.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public provider: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIRequest<T>(
  request: () => Promise<T>,
  provider: string
): Promise<T> {
  try {
    return await request();
  } catch (error: any) {
    if (error.response) {
      throw new APIError(
        error.response.status,
        error.response.data?.message || 'API request failed',
        provider
      );
    }
    throw error;
  }
}
```

### 4. Caching Strategy

```typescript
// utils/api-cache.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function getCachedAPIResponse<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  // Check cache
  const { data: cached } = await supabase
    .from('api_cache')
    .select('data, created_at')
    .eq('key', key)
    .single();
  
  if (cached && Date.now() - new Date(cached.created_at).getTime() < ttl * 1000) {
    return cached.data as T;
  }
  
  // Fetch fresh data
  const freshData = await fetcher();
  
  // Update cache
  await supabase
    .from('api_cache')
    .upsert({ key, data: freshData, created_at: new Date().toISOString() });
  
  return freshData;
}
```

## API Cost Optimization

### Estimated Monthly Costs (1,000 active users)

| Service | Usage | Cost/Month |
|---------|-------|-----------|
| OpenAI (GPT-4) | 50K queries | $150-300 |
| OpenAI (Embeddings) | 100K chunks | $10-20 |
| MarketCheck | 10K lookups | $100 |
| Black Book | 5K lookups | $250 |
| CarMD | 3K diagnostics | $150 |
| Google Places | 5K searches | $25 |
| Stripe | 500 subscriptions | $14.50 |
| **Total** | | **~$700-760** |

### Cost Reduction Strategies

1. **Caching**: Cache VIN decodes, valuations for 24 hours
2. **Batch Processing**: Group API calls where possible
3. **Tier Restrictions**: Limit expensive features (AI, diagnostics) to Pro/Dealer tiers
4. **Rate Limiting**: Prevent abuse with user quotas
5. **Alternative Providers**: Use free APIs (NHTSA) when available

## Monitoring & Logging

Track API usage and errors:

```typescript
// utils/api-logger.ts
export async function logAPICall(
  provider: string,
  endpoint: string,
  success: boolean,
  responseTime: number,
  cost?: number
) {
  await supabase.from('api_logs').insert({
    provider,
    endpoint,
    success,
    response_time_ms: responseTime,
    cost_usd: cost,
    timestamp: new Date().toISOString(),
  });
}
```

## Conclusion

This API integration guide provides the foundation for implementing all major features of Gear AI CoPilot. By following best practices for security, caching, and cost optimization, the application can scale efficiently while maintaining a high-quality user experience.
