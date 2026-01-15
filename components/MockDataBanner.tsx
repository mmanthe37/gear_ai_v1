import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MockDataBannerProps {
  visible?: boolean;
}

export default function MockDataBanner({ visible = true }: MockDataBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if dismissed or not visible
  if (isDismissed || !visible) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#FFA500', '#FF8C00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={styles.text}>Demo Mode - Using Mock Data</Text>
      </View>
      <TouchableOpacity 
        onPress={() => setIsDismissed(true)}
        style={styles.closeButton}
        accessibilityLabel="Dismiss demo mode banner"
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
