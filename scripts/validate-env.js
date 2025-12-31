#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Checks if required environment variables are set
 */

// Define required environment variables by context
const REQUIRED_VARS = {
  development: [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ],
  production: [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'NODE_ENV',
  ],
};

// Optional but recommended variables
const RECOMMENDED_VARS = [
  'OPENAI_API_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'SENTRY_DSN',
];

function validateEnvironment(env = 'development') {
  console.log('🔍 Validating environment variables...\n');

  const required = REQUIRED_VARS[env] || REQUIRED_VARS.development;
  const missing = [];
  const present = [];

  // Check required variables
  required.forEach((varName) => {
    if (process.env[varName]) {
      present.push(varName);
      console.log('✓', varName);
    } else {
      missing.push(varName);
      console.log('✗', varName, '(REQUIRED)');
    }
  });

  console.log();

  // Check recommended variables
  const missingRecommended = [];
  RECOMMENDED_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      missingRecommended.push(varName);
      console.log('⚠', varName, '(optional)');
    }
  });

  console.log();

  // Summary
  if (missing.length === 0) {
    console.log('✓ All required environment variables are set!');
    
    if (missingRecommended.length > 0) {
      console.log(`\n⚠ ${missingRecommended.length} optional variable(s) not set.`);
      console.log('These are not required but enable additional features.');
    }
    
    process.exit(0);
  } else {
    console.log(`✗ ${missing.length} required variable(s) missing!`);
    console.log('\nMissing variables:');
    missing.forEach((varName) => {
      console.log('  -', varName);
    });
    console.log('\nTo fix:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in your API keys');
    console.log('3. Run this script again\n');
    
    process.exit(1);
  }
}

// Run validation
const env = process.env.NODE_ENV || 'development';
validateEnvironment(env);
