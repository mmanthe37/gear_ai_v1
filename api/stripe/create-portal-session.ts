/**
 * Vercel Serverless Function - Create Stripe Customer Portal Session
 * 
 * Creates a Stripe customer portal session for managing subscriptions
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        message: 'Missing required field: userId' 
      });
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      return res.status(400).json({ 
        message: 'No Stripe customer ID found for user' 
      });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.EXPO_PUBLIC_APP_URL || 'exp://localhost:8081'}/subscription/manage`,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error' 
    });
  }
}
