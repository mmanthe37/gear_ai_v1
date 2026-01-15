import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import AnimatedBackground from '../../components/AnimatedBackground';
import ModernServiceCard from '../../components/ModernServiceCard';
import { MaintenanceRecord } from '../../types';
import {
  getUserVehicles,
  getVehicleMaintenanceHistory,
  getCurrentUser,
  getErrorMessage,
} from '../../services/database-service';

interface ServiceReminderDisplay {
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
  const [services, setServices] = useState<ServiceReminderDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaintenanceRecords();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMaintenanceRecords();
    }, [])
  );

  const loadMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get all vehicles for the user
      const vehicles = await getUserVehicles(user.id);
      
      // Get maintenance records for all vehicles
      const allRecords: MaintenanceRecord[] = [];
      for (const vehicle of vehicles) {
        const records = await getVehicleMaintenanceHistory(vehicle.vehicle_id);
        allRecords.push(...records);
      }

      // Transform to display format
      const displayRecords: ServiceReminderDisplay[] = allRecords.map((record) => {
        const vehicle = vehicles.find(v => v.vehicle_id === record.vehicle_id);
        const vehicleName = vehicle 
          ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`
          : 'Unknown Vehicle';

        // Determine if completed (you may want to add a completed field to MaintenanceRecord)
        const completed = false; // For now, showing all as pending

        // Calculate priority based on next service date
        let priority: 'low' | 'medium' | 'high' = 'low';
        if (record.next_service_date) {
          const daysUntilService = Math.floor(
            (new Date(record.next_service_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilService < 0) {
            priority = 'high'; // overdue
          } else if (daysUntilService < 30) {
            priority = 'high';
          } else if (daysUntilService < 60) {
            priority = 'medium';
          }
        }

        const dueDate = record.next_service_date
          ? new Date(record.next_service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
          id: record.record_id,
          title: record.title,
          description: record.description || `${record.type} service`,
          dueDate,
          priority,
          vehicle: vehicleName,
          completed,
        };
      });

      setServices(displayRecords);
    } catch (error) {
      console.error('Error loading maintenance records:', error);
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

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

  if (loading && services.length === 0) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4500" />
          <Text style={styles.loadingText}>Loading maintenance records...</Text>
        </View>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
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