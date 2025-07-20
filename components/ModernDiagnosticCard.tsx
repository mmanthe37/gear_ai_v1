import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ModernDiagnosticCardProps {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  vehicle: string;
  dateDetected: string;
  onPress?: () => void;
}

const severityColors = {
  low: '#00FF00',
  medium: '#FF8C00',
  high: '#FF4500',
};

const severityIcons: Record<'low' | 'medium' | 'high', keyof typeof Ionicons.glyphMap> = {
  low: 'information-circle',
  medium: 'warning',
  high: 'alert-circle',
};

export default function ModernDiagnosticCard({
  code,
  description,
  severity,
  vehicle,
  dateDetected,
  onPress,
}: ModernDiagnosticCardProps) {
  const severityColor = severityColors[severity];
  const severityIcon = severityIcons[severity];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
                  colors={[severityColor, `${severityColor}CC`]}
                  style={styles.iconGradient}
                >
                  <Ionicons name={severityIcon} size={24} color="white" />
                </LinearGradient>
              </View>

              <View style={styles.mainContent}>
                <View style={styles.codeContainer}>
                  <Text style={styles.code}>{code}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: `${severityColor}60` }]}>
                    <Text style={styles.severityText}>{severity.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.description}>{description}</Text>
                <Text style={styles.vehicle}>{vehicle}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.dateDetected}>DETECTED: {dateDetected}</Text>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: severityColor }]} />
                <Ionicons name="chevron-forward" size={16} color="#FF8C00" />
              </View>
            </View>

            <View style={styles.diagnosticBar}>
              <LinearGradient
                colors={[severityColor, `${severityColor}80`, `${severityColor}40`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.diagnosticGradient}
              />
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  gradient: {
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
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
  mainContent: {
    flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  code: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    color: '#E0E0E0',
    marginBottom: 4,
    lineHeight: 18,
    fontWeight: '500',
  },
  vehicle: {
    fontSize: 12,
    color: '#1E90FF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 144, 255, 0.2)',
    marginBottom: 8,
  },
  dateDetected: {
    fontSize: 11,
    color: '#E0E0E0',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  diagnosticBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  diagnosticGradient: {
    flex: 1,
  },
});