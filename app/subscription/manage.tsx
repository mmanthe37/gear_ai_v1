/**
 * Gear AI CoPilot - Manage Subscription Screen
 * 
 * Allows users to view and manage their subscription
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AnimatedBackground from '../../components/AnimatedBackground';
import { SubscriptionTiers, SubscriptionTier } from '../../types/user';
import { getSubscriptionStatus, createPortalSession, isInTrialPeriod } from '../../services/subscription-service';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

export default function ManageSubscriptionScreen() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string>('');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [inTrial, setInTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('user_id')
          .eq('firebase_uid', user.id)
          .single();
        
        if (userData) {
          setUserId(userData.user_id);
          
          // Get subscription status
          const status = await getSubscriptionStatus(userData.user_id);
          setCurrentTier(status.tier);
          setSubscriptionStatus(status.status);
          setCurrentPeriodEnd(status.current_period_end || '');
          setCancelAtPeriodEnd(status.cancel_at_period_end || false);

          // Check trial status
          const trialStatus = await isInTrialPeriod(userData.user_id);
          setInTrial(trialStatus.isInTrial);
          setTrialDaysRemaining(trialStatus.daysRemaining || 0);
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      Alert.alert('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to manage billing');
      return;
    }

    setPortalLoading(true);

    try {
      const { url } = await createPortalSession(userId);
      
      // Open Stripe customer portal
      await WebBrowser.openBrowserAsync(url);
      
      // Refresh subscription after browser closes
      setTimeout(() => {
        loadSubscription();
      }, 2000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    router.push('/subscription/plans');
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

  const tierInfo = SubscriptionTiers[currentTier];
  const nextBillingDate = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'N/A';

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>MANAGE SUBSCRIPTION</Text>
          <Text style={styles.subtitle}>View and update your plan</Text>
        </View>

        {/* Trial Banner */}
        {inTrial && (
          <View style={styles.trialBanner}>
            <LinearGradient
              colors={['#FF4500', '#FF8C00']}
              style={styles.trialGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="time" size={24} color="#fff" />
              <View style={styles.trialContent}>
                <Text style={styles.trialTitle}>Trial Active</Text>
                <Text style={styles.trialText}>
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Current Plan Card */}
        <View style={styles.planCard}>
          <LinearGradient
            colors={['rgba(30,144,255,0.2)', 'rgba(0,102,204,0.1)']}
            style={styles.planGradient}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planLabel}>CURRENT PLAN</Text>
                <Text style={styles.planName}>{tierInfo.name}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceSymbol}>$</Text>
                <Text style={styles.priceAmount}>{tierInfo.price_monthly.toFixed(2)}</Text>
                {tierInfo.price_monthly > 0 && <Text style={styles.priceInterval}>/mo</Text>}
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, getStatusColor(subscriptionStatus)]}>
                <Text style={styles.statusText}>{subscriptionStatus.toUpperCase()}</Text>
              </View>
              {cancelAtPeriodEnd && (
                <Text style={styles.cancelText}>Cancels on {nextBillingDate}</Text>
              )}
            </View>

            {currentTier !== 'free' && !cancelAtPeriodEnd && (
              <View style={styles.billingInfo}>
                <View style={styles.billingRow}>
                  <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.billingText}>Next billing date: {nextBillingDate}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Ionicons name="card" size={20} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.billingText}>Amount: ${tierInfo.price_monthly.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Plan Features:</Text>
              {getFeaturesList(currentTier).map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#1E90FF" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {currentTier !== 'premium' && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleUpgradePlan}>
              <Ionicons name="arrow-up-circle" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}

          {currentTier !== 'free' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <ActivityIndicator size="small" color="#1E90FF" />
              ) : (
                <>
                  <Ionicons name="settings" size={20} color="#1E90FF" />
                  <Text style={styles.secondaryButtonText}>Manage Billing</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#1E90FF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Billing Portal</Text>
            <Text style={styles.infoText}>
              Use "Manage Billing" to update payment methods, view invoices, or cancel your subscription.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getFeaturesList(tier: SubscriptionTier): string[] {
  const tierInfo = SubscriptionTiers[tier];
  const features: string[] = [];
  
  const maxVehicles = tierInfo.features.max_vehicles;
  features.push(maxVehicles === 'unlimited' ? 'Unlimited vehicles' : `Up to ${maxVehicles} vehicle${maxVehicles > 1 ? 's' : ''}`);
  
  if (tierInfo.features.ocr_vin_scan) features.push('OCR VIN scanning');
  if (tierInfo.features.rag_manual_chat) features.push('AI-powered manual chat');
  if (tierInfo.features.obd_diagnostics) features.push('OBD-II diagnostics');
  if (tierInfo.features.damage_detection) features.push('Damage detection');
  if (tierInfo.features.valuation_tracking) features.push('Valuation tracking');
  
  return features;
}

function getStatusColor(status: string): object {
  switch (status) {
    case 'active':
      return { backgroundColor: 'rgba(34,197,94,0.2)' };
    case 'trialing':
      return { backgroundColor: 'rgba(255,140,0,0.2)' };
    case 'past_due':
      return { backgroundColor: 'rgba(255,69,0,0.2)' };
    case 'canceled':
      return { backgroundColor: 'rgba(156,163,175,0.2)' };
    default:
      return { backgroundColor: 'rgba(156,163,175,0.2)' };
  }
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
  trialBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  trialGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  trialContent: {
    marginLeft: 12,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  trialText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  planCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  planGradient: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  planName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceSymbol: {
    fontSize: 18,
    color: '#fff',
    marginTop: 2,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceInterval: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    marginLeft: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  cancelText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  billingInfo: {
    marginBottom: 16,
  },
  billingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  billingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
  },
  featuresContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    letterSpacing: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E90FF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,144,255,0.1)',
    borderWidth: 1,
    borderColor: '#1E90FF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: 'rgba(30,144,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.2)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
});
