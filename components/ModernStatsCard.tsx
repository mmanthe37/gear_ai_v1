import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ModernStatsCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function ModernStatsCard({
  title,
  value,
  icon,
  color,
  subtitle,
  trend = 'stable',
}: ModernStatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#00FF00';
      case 'down': return '#FF4500';
      default: return '#1E90FF';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={25} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={[
            'rgba(30, 144, 255, 0.2)',
            'rgba(0, 191, 255, 0.1)',
            'rgba(30, 144, 255, 0.05)'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[color, `${color}CC`]}
                  style={styles.iconGradient}
                >
                  <Ionicons name={icon} size={24} color="white" />
                </LinearGradient>
              </View>
              
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={getTrendIcon()} 
                  size={16} 
                  color={getTrendColor()} 
                />
              </View>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.title}>{title}</Text>
              {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>
            
            <View style={styles.performanceBar}>
              <LinearGradient
                colors={[color, `${color}80`, `${color}40`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.performanceGradient}
              />
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    padding: 16,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 6,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E0E0E0',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E90FF',
    marginTop: 2,
    textAlign: 'center',
  },
  performanceBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  performanceGradient: {
    flex: 1,
  },
});