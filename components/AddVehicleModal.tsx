import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SubscriptionTier } from '../types/user';

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (vehicle: { make: string; model: string; year: number; vin?: string }) => void;
  canAdd: boolean;
  limit: number | 'unlimited';
  tierRequired?: SubscriptionTier;
  currentTier: SubscriptionTier;
}

export default function AddVehicleModal({ 
  visible, 
  onClose, 
  onAdd, 
  canAdd, 
  limit, 
  tierRequired, 
  currentTier 
}: AddVehicleModalProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');

  const handleAdd = () => {
    if (!canAdd) {
      Alert.alert(
        'Vehicle Limit Reached',
        `Your ${currentTier} plan allows ${limit} vehicle${typeof limit === 'number' && limit > 1 ? 's' : ''}. Upgrade to ${tierRequired} to add more vehicles.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => {
              onClose();
              router.push('/subscription/plans');
            }
          },
        ]
      );
      return;
    }

    if (!make || !model || !year) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    onAdd({ make, model, year: yearNum, vin: vin || undefined });
    setMake('');
    setModel('');
    setYear('');
    setVin('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Vehicle</Text>
          <TouchableOpacity onPress={handleAdd}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          {!canAdd && (
            <View style={styles.limitWarning}>
              <Ionicons name="warning" size={24} color="#FF4500" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Vehicle Limit Reached</Text>
                <Text style={styles.warningText}>
                  Upgrade to {tierRequired} to add more vehicles
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.label}>Make *</Text>
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholder="e.g., Toyota"
          />
          
          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="e.g., Camry"
          />
          
          <Text style={styles.label}>Year *</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder="e.g., 2023"
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>VIN (Optional)</Text>
          <TextInput
            style={styles.input}
            value={vin}
            onChangeText={setVin}
            placeholder="17-character VIN"
            maxLength={17}
            editable={canAdd}
          />

          {!canAdd && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                onClose();
                router.push('/subscription/plans');
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Add More Vehicles</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  limitWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4500',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
  },
  upgradeButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});