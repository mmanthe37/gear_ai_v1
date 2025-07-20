import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBackground from '../../components/AnimatedBackground';
import ModernServiceCard from '../../components/ModernServiceCard';

interface ServiceReminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  vehicle: string;
  completed: boolean;
}

export default function MaintenanceScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [services] = useState<ServiceReminder[]>([
    {
      id: '1',
      title: 'Oil Change',
      description: 'Regular engine oil and filter replacement',
      dueDate: 'Dec 15',
      priority: 'high',
      vehicle: 'Toyota Camry 2023',
      completed: false,
    },
    {
      id: '2',
      title: 'Tire Rotation',
      description: 'Rotate tires for even wear',
      dueDate: 'Jan 10',
      priority: 'medium',
      vehicle: 'Honda Civic 2022',
      completed: false,
    },
    {
      id: '3',
      title: 'Brake Inspection',
      description: 'Check brake pads and rotors',
      dueDate: 'Feb 20',
      priority: 'low',
      vehicle: 'Toyota Camry 2023',
      completed: true,
    },
  ]);

  const filteredServices = services.filter(service => {
    if (filter === 'pending') return !service.completed;
    if (filter === 'completed') return service.completed;
    return true;
  });

  const FilterButton = ({ type, label }: { type: typeof filter; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === type && styles.activeFilter]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.activeFilterText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Maintenance</Text>
          <Text style={styles.subtitle}>Keep your vehicles in top condition</Text>
        </View>

        <View style={styles.filterContainer}>
          <FilterButton type="all" label="All" />
          <FilterButton type="pending" label="Pending" />
          <FilterButton type="completed" label="Completed" />
        </View>

        <View style={styles.servicesContainer}>
          {filteredServices.map((service) => (
            <ModernServiceCard
              key={service.id}
              title={service.title}
              description={service.description}
              dueDate={service.dueDate}
              priority={service.priority}
              vehicle={service.vehicle}
            />
          ))}
        </View>

        {filteredServices.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="build-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>No maintenance items</Text>
            <Text style={styles.emptySubtext}>All caught up!</Text>
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
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeFilterText: {
    color: 'white',
  },
  servicesContainer: {
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