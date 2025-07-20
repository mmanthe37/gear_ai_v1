import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBackground from '../../components/AnimatedBackground';
import ModernVehicleCard from '../../components/ModernVehicleCard';
import ModernStatsCard from '../../components/ModernStatsCard';
import AddVehicleModal from '../../components/AddVehicleModal';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage?: number;
}

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', make: 'Toyota', model: 'Supra', year: 2023, vin: '1HGBH41JXMN109186', mileage: 15000 },
    { id: '2', make: 'BMW', model: 'M3', year: 2022, mileage: 8500 },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: Date.now().toString(),
    };
    setVehicles([...vehicles, newVehicle]);
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    router.push({
      pathname: '/chat/[id]',
      params: { 
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
      },
    });
  };

  const totalVehicles = vehicles.length;
  const avgMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0) / totalVehicles;
  const pendingMaintenance = 3;
  const activeCodes = 2;

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>GARAGE</Text>
          <Text style={styles.subtitle}>Performance Dashboard</Text>
        </View>

        <View style={styles.statsContainer}>
          <ModernStatsCard
            title="Vehicles"
            value={totalVehicles.toString()}
            icon="car-sport"
            color="#FF4500"
            trend="up"
          />
          <ModernStatsCard
            title="Avg Miles"
            value={Math.round(avgMileage).toLocaleString()}
            icon="speedometer"
            color="#1E90FF"
            trend="stable"
          />
        </View>

        <View style={styles.statsContainer}>
          <ModernStatsCard
            title="Service"
            value={pendingMaintenance.toString()}
            icon="build"
            color="#FF8C00"
            subtitle="due"
            trend="down"
          />
          <ModernStatsCard
            title="Codes"
            value={activeCodes.toString()}
            icon="warning"
            color="#FF4500"
            subtitle="active"
            trend="up"
          />
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY RIDES</Text>
          <View style={styles.accentLine} />
        </View>
        
        {vehicles.map((vehicle) => (
          <ModernVehicleCard
            key={vehicle.id}
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            vin={vehicle.vin}
            mileage={vehicle.mileage}
            onPress={() => handleVehiclePress(vehicle)}
          />
        ))}
        
        {vehicles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={64} color="rgba(255,140,0,0.5)" />
            <Text style={styles.emptyText}>No vehicles in garage</Text>
            <Text style={styles.emptySubtext}>Add your ride to get started</Text>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient
          colors={['#FF4500', '#FF8C00']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>
      
      <AddVehicleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddVehicle}
      />
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
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 69, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#1E90FF',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  sectionHeader: {
    marginVertical: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  accentLine: {
    width: 60,
    height: 3,
    backgroundColor: '#FF4500',
    marginTop: 8,
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#1E90FF',
    marginTop: 8,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 68,
    height: 68,
    borderRadius: 34,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  fabGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
});