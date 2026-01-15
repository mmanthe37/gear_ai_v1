/**
 * Gear AI CoPilot - Subscription Plans Screen
 * 
 * Displays available subscription tiers and allows users to upgrade
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AnimatedBackground from '../../components/AnimatedBackground';
import { SubscriptionTiers, SubscriptionTier } from '../../types/user';
import { createCheckoutSession } from '../../services/subscription-service';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

export default function SubscriptionPlansScreen() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadUserSubscription();
  }, []);

  const loadUserSubscription = async () => {
    try {
      // Get current user from Firebase/Supabase
      // For now, using a placeholder - you would get this from your auth context
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('user_id, tier')
          .eq('firebase_uid', user.id)
          .single();
        
        if (userData) {
          setUserId(userData.user_id);
          setCurrentTier(userData.tier || 'free');
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to subscribe');
      return;
    }

    // Map tier to price ID (would come from env variables in production)
    const priceId = tier === 'pro' 
      ? process.env.STRIPE_PRICE_PRO_MONTHLY 
      : process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

    if (!priceId) {
      Alert.alert('Error', 'Price ID not configured');
      return;
    }

    setCheckoutLoading(tier);

    try {
      const { url } = await createCheckoutSession(userId, priceId);
      
      // Open Stripe checkout in browser
      await WebBrowser.openBrowserAsync(url);
      
      // Refresh subscription after browser closes
      setTimeout(() => {
        loadUserSubscription();
      }, 2000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create checkout session');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E90FF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>SUBSCRIPTION PLANS</Text>
          <Text style={styles.subtitle}>Choose the plan that's right for you</Text>
        </View>

        <View style={styles.plansContainer}>
          {/* FREE TIER */}
          <TierCard
            tier="free"
            name={SubscriptionTiers.free.name}
            price={SubscriptionTiers.free.price_monthly}
            features={[
              `${SubscriptionTiers.free.features.max_vehicles} vehicle`,
              'VIN entry',
              'Manual access',
              'Basic AI chat',
            ]}
            currentTier={currentTier}
            onSelect={() => {}}
            isCurrentPlan={currentTier === 'free'}
            loading={false}
          />

          {/* PRO TIER */}
          <TierCard
            tier="pro"
            name={SubscriptionTiers.pro.name}
            price={SubscriptionTiers.pro.price_monthly}
            features={[
              `Up to ${SubscriptionTiers.pro.features.max_vehicles} vehicles`,
              'OCR VIN scanning',
              'RAG-powered manual chat',
              'Valuation tracking',
              '7-day free trial',
            ]}
            currentTier={currentTier}
            onSelect={() => handleUpgrade('pro')}
            isCurrentPlan={currentTier === 'pro'}
            loading={checkoutLoading === 'pro'}
            popular={true}
          />

          {/* PREMIUM TIER */}
          <TierCard
            tier="premium"
            name={SubscriptionTiers.premium.name}
            price={SubscriptionTiers.premium.price_monthly}
            features={[
              'Unlimited vehicles',
              'OBD-II diagnostics',
              'Damage detection',
              'Marketplace tools',
              'Priority support',
            ]}
            currentTier={currentTier}
            onSelect={() => handleUpgrade('premium')}
            isCurrentPlan={currentTier === 'premium'}
            loading={checkoutLoading === 'premium'}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include secure payment processing via Stripe
          </Text>
          <TouchableOpacity onPress={() => router.push('/subscription/manage' as any)}>
            <Text style={styles.manageLink}>Manage Subscription →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

interface TierCardProps {
  tier: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
  currentTier: SubscriptionTier;
  onSelect: () => void;
  isCurrentPlan: boolean;
  loading: boolean;
  popular?: boolean;
}

function TierCard({ tier, name, price, features, currentTier, onSelect, isCurrentPlan, loading, popular }: TierCardProps) {
  return (
    <View style={styles.tierCard}>
      {popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      
      <LinearGradient
        colors={isCurrentPlan ? ['#1E90FF', '#0066CC'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.tierGradient}
      >
        <Text style={styles.tierName}>{name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceSymbol}>$</Text>
          <Text style={styles.priceAmount}>{price.toFixed(2)}</Text>
          {price > 0 && <Text style={styles.priceInterval}>/mo</Text>}
        </View>

        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.currentText}>CURRENT PLAN</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark" size={20} color="#1E90FF" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isCurrentPlan && tier !== 'free' && (
          <TouchableOpacity
            style={[styles.upgradeButton, loading && styles.upgradeButtonDisabled]}
            onPress={onSelect}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.upgradeButtonText}>
                {currentTier === 'free' ? 'Start Free Trial' : 'Upgrade'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tierCard: {
    marginBottom: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF4500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tierGradient: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  priceSymbol: {
    fontSize: 24,
    color: '#fff',
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceInterval: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
    marginLeft: 4,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  currentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 1,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
  },
  upgradeButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 16,
  },
  manageLink: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '600',
  },
});
