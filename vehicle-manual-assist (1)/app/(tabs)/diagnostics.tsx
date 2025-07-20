import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedBackground from '../../components/AnimatedBackground';
import ModernDiagnosticCard from '../../components/ModernDiagnosticCard';

interface DiagnosticCode {
  id: string;
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  vehicle: string;
  dateDetected: string;
}

export default function DiagnosticsScreen() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [diagnostics] = useState<DiagnosticCode[]>([
    {
      id: '1',
      code: 'P0420',
      description: 'Catalyst System Efficiency Below Threshold',
      severity: 'medium',
      vehicle: 'Toyota Camry 2023',
      dateDetected: 'Dec 10, 2024',
    },
    {
      id: '2',
      code: 'P0171',
      description: 'System Too Lean (Bank 1)',
      severity: 'high',
      vehicle: 'Honda Civic 2022',
      dateDetected: 'Dec 8, 2024',
    },
    {
      id: '3',
      code: 'B1342',
      description: 'ECM/PCM Processor',
      severity: 'low',
      vehicle: 'Toyota Camry 2023',
      dateDetected: 'Dec 5, 2024',
    },
  ]);

  const filteredDiagnostics = diagnostics.filter(diagnostic => {
    if (filter === 'all') return true;
    return diagnostic.severity === filter;
  });

  const FilterButton = ({ type, label, count }: { type: typeof filter; label: string; count: number }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === type && styles.activeFilter]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.activeFilterText]}>
        {label}
      </Text>
      <View style={[styles.countBadge, filter === type && styles.activeCountBadge]}>
        <Text style={[styles.countText, filter === type && styles.activeCountText]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getCounts = () => {
    return {
      all: diagnostics.length,
      high: diagnostics.filter(d => d.severity === 'high').length,
      medium: diagnostics.filter(d => d.severity === 'medium').length,
      low: diagnostics.filter(d => d.severity === 'low').length,
    };
  };

  const counts = getCounts();

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Diagnostics</Text>
          <Text style={styles.subtitle}>Monitor your vehicle health</Text>
        </View>

        <View style={styles.filterContainer}>
          <FilterButton type="all" label="All" count={counts.all} />
          <FilterButton type="high" label="High" count={counts.high} />
          <FilterButton type="medium" label="Medium" count={counts.medium} />
          <FilterButton type="low" label="Low" count={counts.low} />
        </View>

        <View style={styles.diagnosticsContainer}>
          {filteredDiagnostics.map((diagnostic) => (
            <ModernDiagnosticCard
              key={diagnostic.id}
              code={diagnostic.code}
              description={diagnostic.description}
              severity={diagnostic.severity}
              vehicle={diagnostic.vehicle}
              dateDetected={diagnostic.dateDetected}
            />
          ))}
        </View>

        {filteredDiagnostics.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>No diagnostic codes</Text>
            <Text style={styles.emptySubtext}>Your vehicles are running smoothly!</Text>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 30,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeFilter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 6,
  },
  activeFilterText: {
    color: 'white',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeCountText: {
    color: 'white',
  },
  diagnosticsContainer: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
});