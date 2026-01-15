/**
 * Gear AI CoPilot - Subscription Success Screen
 * 
 * Shown after successful subscription checkout
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function SubscriptionSuccessScreen() {
  const { session_id } = useLocalSearchParams();

  useEffect(() => {
    // Optionally verify the session on the backend
    if (session_id) {
      console.log('Checkout session completed:', session_id);
    }
  }, [session_id]);

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <View style={styles.content}>
        <LinearGradient
          colors={['rgba(34,197,94,0.3)', 'rgba(34,197,94,0.1)']}
          style={styles.iconContainer}
        >
          <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
        </LinearGradient>

        <Text style={styles.title}>Subscription Activated!</Text>
        <Text style={styles.subtitle}>
          Welcome to your upgraded plan. You now have access to all premium features.
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#1E90FF" />
            <Text style={styles.benefitText}>7-day free trial started</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#1E90FF" />
            <Text style={styles.benefitText}>All features unlocked</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#1E90FF" />
            <Text style={styles.benefitText}>Cancel anytime</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
        >
          <LinearGradient
            colors={['#1E90FF', '#0066CC']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => router.push('/subscription/manage')}
        >
          <Text style={styles.manageButtonText}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 12,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  buttonGradient: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  manageButton: {
    paddingVertical: 12,
  },
  manageButtonText: {
    fontSize: 16,
    color: '#1E90FF',
    fontWeight: '600',
  },
});
