/**
 * Gear AI CoPilot - Feature Access Hook
 * 
 * Hook to check if user has access to specific features based on subscription tier
 */

import { useState, useEffect } from 'react';
import { SubscriptionTier, SubscriptionTiers } from '../types/user';
import { supabase } from '../lib/supabase';

export interface FeatureAccessResult {
  hasAccess: boolean;
  tierRequired?: SubscriptionTier;
  currentTier: SubscriptionTier;
  loading: boolean;
}

/**
 * Hook to check if user has access to a feature
 */
export function useFeatureAccess(
  userId: string | undefined, 
  feature: string
): FeatureAccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [tierRequired, setTierRequired] = useState<SubscriptionTier | undefined>();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        // Get user's subscription tier
        const { data: user, error } = await supabase
          .from('users')
          .select('tier, subscription_status')
          .eq('user_id', userId)
          .single();

        if (error || !user) {
          setHasAccess(false);
          setCurrentTier('free');
          setLoading(false);
          return;
        }

        const tier = (user.tier || 'free') as SubscriptionTier;
        setCurrentTier(tier);

        const tierFeatures = SubscriptionTiers[tier];
        if (!tierFeatures) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Check if feature exists in tier
        const access = (tierFeatures.features as any)[feature] === true;
        setHasAccess(access);

        // Determine required tier if no access
        if (!access) {
          const requiredTier = findRequiredTier(feature);
          setTierRequired(requiredTier);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
        setLoading(false);
      }
    };

    checkAccess();
  }, [userId, feature]);

  return { hasAccess, tierRequired, currentTier, loading };
}

/**
 * Find the minimum tier required for a feature
 */
function findRequiredTier(feature: string): SubscriptionTier | undefined {
  const tiers: SubscriptionTier[] = ['free', 'pro', 'premium', 'dealer'];
  
  for (const tier of tiers) {
    const tierFeatures = SubscriptionTiers[tier];
    if ((tierFeatures.features as any)[feature] === true) {
      return tier;
    }
  }
  
  return undefined;
}

/**
 * Hook to check vehicle limit for user's tier
 */
export function useVehicleLimit(
  userId: string | undefined,
  currentVehicleCount: number
): {
  canAdd: boolean;
  limit: number | 'unlimited';
  tierRequired?: SubscriptionTier;
  currentTier: SubscriptionTier;
  loading: boolean;
} {
  const [canAdd, setCanAdd] = useState(false);
  const [limit, setLimit] = useState<number | 'unlimited'>(1);
  const [tierRequired, setTierRequired] = useState<SubscriptionTier | undefined>();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkLimit = async () => {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('tier, subscription_status')
          .eq('user_id', userId)
          .single();

        if (error || !user) {
          setCanAdd(false);
          setLimit(1);
          setCurrentTier('free');
          setLoading(false);
          return;
        }

        const tier = (user.tier || 'free') as SubscriptionTier;
        setCurrentTier(tier);

        const tierFeatures = SubscriptionTiers[tier];
        const maxVehicles = tierFeatures.features.max_vehicles;
        setLimit(maxVehicles);

        if (maxVehicles === 'unlimited') {
          setCanAdd(true);
        } else {
          const canAddVehicle = currentVehicleCount < maxVehicles;
          setCanAdd(canAddVehicle);
          
          if (!canAddVehicle) {
            // Suggest next tier
            const nextTier = tier === 'free' ? 'pro' : 'premium';
            setTierRequired(nextTier);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking vehicle limit:', error);
        setCanAdd(false);
        setLimit(1);
        setLoading(false);
      }
    };

    checkLimit();
  }, [userId, currentVehicleCount]);

  return { canAdd, limit, tierRequired, currentTier, loading };
}
