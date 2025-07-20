import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DiagnosticCardProps {
  code: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  onPress: () => void;
}

export default function DiagnosticCard({
  code,
  description,
  severity,
  timestamp,
  onPress,
}: DiagnosticCardProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'critical': return '#FF3B30';
      case 'warning': return '#FF9500';
      case 'info': return '#007AFF';
      default: return '#666';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Ionicons 
          name={getSeverityIcon()} 
          size={24} 
          color={getSeverityColor()} 
        />
        <View style={styles.info}>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  code: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});