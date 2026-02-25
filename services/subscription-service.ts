/**
 * Gear AI CoPilot - Subscription Service
 * 
 * Handles Stripe subscription management and feature access control
 */

import { supabase } from '../lib/supabase';
import { SubscriptionTier, SubscriptionStatus, SubscriptionTiers } from '../types/user';

export interface SubscriptionStatusResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  stripe_subscription_id?: string;
  trial_end?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe checkout session for a subscription
 */
export async function createCheckoutSession(
  userId: string, 
  priceId: string
): Promise<CheckoutSessionResponse> {
  try {
    // Call the Vercel serverless function
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        priceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    return {
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    throw new Error(error.message || 'Failed to cancel subscription');
  }
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(
  userId: string, 
  newPriceId: string
): Promise<void> {
  try {
    const response = await fetch('/api/stripe/update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        newPriceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update subscription');
    }
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    throw new Error(error.message || 'Failed to update subscription');
  }
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatusResponse> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('tier, subscription_status, subscription_period_end, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }

    // Get subscription details if exists
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return {
      tier: user.tier || 'free',
      status: user.subscription_status || 'none',
      current_period_end: user.subscription_period_end,
      cancel_at_period_end: subscription?.cancel_at_period_end,
      stripe_subscription_id: subscription?.stripe_subscription_id,
      trial_end: subscription?.trial_end,
    };
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    throw new Error(error.message || 'Failed to get subscription status');
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string, 
  feature: string
): Promise<boolean> {
  try {
    // Get user's subscription tier
    const { data: user, error } = await supabase
      .from('users')
      .select('tier, subscription_status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user tier:', error);
      return false;
    }

    const tier = user.tier || 'free';
    const tierFeatures = SubscriptionTiers[tier as SubscriptionTier];

    if (!tierFeatures) {
      return false;
    }

    // Check if feature exists in tier
    return (tierFeatures.features as any)[feature] === true;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Check vehicle count limit for user's tier
 */
export async function checkVehicleLimit(
  userId: string, 
  currentVehicleCount: number
): Promise<{ canAdd: boolean; limit: number | 'unlimited'; tierRequired?: SubscriptionTier }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('tier, subscription_status')
      .eq('user_id', userId)
      .single();

    if (error) {
      return { canAdd: false, limit: 1 };
    }

    const tier = user.tier || 'free';
    const tierFeatures = SubscriptionTiers[tier as SubscriptionTier];
    const maxVehicles = tierFeatures.features.max_vehicles;

    if (maxVehicles === 'unlimited') {
      return { canAdd: true, limit: 'unlimited' };
    }

    const canAdd = currentVehicleCount < maxVehicles;
    const tierRequired = !canAdd ? (tier === 'free' ? 'pro' : 'premium') : undefined;

    return { 
      canAdd, 
      limit: maxVehicles,
      tierRequired,
    };
  } catch (error) {
    console.error('Error checking vehicle limit:', error);
    return { canAdd: false, limit: 1 };
  }
}

/**
 * Create a customer portal session for managing billing
 */
export async function createPortalSession(userId: string): Promise<{ url: string }> {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }

    const data = await response.json();
    return { url: data.url };
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    throw new Error(error.message || 'Failed to create portal session');
  }
}

/**
 * Check if user is in trial period
 */
export async function isInTrialPeriod(userId: string): Promise<{ isInTrial: boolean; daysRemaining?: number }> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('trial_end, status')
      .eq('user_id', userId)
      .eq('status', 'trialing')
      .single();

    if (!subscription || !subscription.trial_end) {
      return { isInTrial: false };
    }

    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    
    if (trialEnd < now) {
      return { isInTrial: false };
    }

    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isInTrial: true,
      daysRemaining,
    };
  } catch (error) {
    console.error('Error checking trial period:', error);
    return { isInTrial: false };
  }
}
