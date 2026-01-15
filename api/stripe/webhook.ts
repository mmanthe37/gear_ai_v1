/**
 * Vercel Serverless Function - Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription updates
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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Price ID to tier mapping
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: 'pro',
  [process.env.STRIPE_PRICE_PRO_YEARLY || '']: 'pro',
  [process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '']: 'premium',
  [process.env.STRIPE_PRICE_PREMIUM_YEARLY || '']: 'premium',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error' 
    });
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  
  if (!userId) {
    console.error('No user ID in checkout session metadata');
    return;
  }

  // Update checkout session status
  await supabase
    .from('checkout_sessions')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('session_id', session.id);

  // Get subscription details
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    await handleSubscriptionUpdate(subscription);
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || 'free';
  const status = subscription.status as string;

  // Map Stripe status to our status
  let subscriptionStatus: string;
  const sub = subscription as any; // Type assertion for compatibility
  const trialEndTimestamp = sub.trial_end ? Number(sub.trial_end) : null;
  if (trialEndTimestamp && new Date(trialEndTimestamp * 1000) > new Date()) {
    subscriptionStatus = 'trialing';
  } else if (status === 'active') {
    subscriptionStatus = 'active';
  } else if (status === 'past_due') {
    subscriptionStatus = 'past_due';
  } else if (status === 'canceled') {
    subscriptionStatus = 'canceled';
  } else {
    subscriptionStatus = 'none';
  }

  const currentPeriodEnd = sub.current_period_end 
    ? Number(sub.current_period_end) 
    : Date.now() / 1000;

  // Update user tier and subscription status
  await supabase
    .from('users')
    .update({
      tier,
      subscription_status: subscriptionStatus,
      subscription_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
    })
    .eq('user_id', userId);

  const currentPeriodStart = sub.current_period_start 
    ? Number(sub.current_period_start) 
    : Date.now() / 1000;
  const trialStart = sub.trial_start ? Number(sub.trial_start) : null;

  // Upsert subscription record
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscriptionStatus,
      price_id: priceId,
      current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end || false,
      trial_start: trialStart 
        ? new Date(trialStart * 1000).toISOString() 
        : null,
      trial_end: trialEndTimestamp 
        ? new Date(trialEndTimestamp * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    });

  console.log(`✅ Updated subscription for user ${userId} to tier ${tier}`);
}

/**
 * Handle subscription deleted/canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }

  // Downgrade user to free tier
  const sub = subscription as any; // Type assertion for compatibility
  const currentPeriodEnd = sub.current_period_end 
    ? Number(sub.current_period_end) 
    : Date.now() / 1000;

  await supabase
    .from('users')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      subscription_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
    })
    .eq('user_id', userId);

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`✅ Canceled subscription for user ${userId}`);
}

/**
 * Handle successful payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const inv = invoice as any; // Type assertion for compatibility
  const subscriptionId = inv.subscription 
    ? (typeof inv.subscription === 'string' ? inv.subscription : inv.subscription.id)
    : null;
  
  if (!subscriptionId) {
    return;
  }

  // Subscription will be updated via subscription.updated event
  console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
}

/**
 * Handle failed payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as any; // Type assertion for compatibility
  const subscriptionId = inv.subscription 
    ? (typeof inv.subscription === 'string' ? inv.subscription : inv.subscription.id)
    : null;
  
  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.supabase_user_id;
  
  if (!userId) {
    return;
  }

  // Update subscription status to past_due
  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
    })
    .eq('user_id', userId);

  console.log(`⚠️ Payment failed for user ${userId}`);
}
