import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadVehiclePhoto } from '../services/storage-service';

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (vehicle: { make: string; model: string; year: number; vin?: string; photoUrl?: string }) => void;
}

export default function AddVehicleModal({ visible, onClose, onAdd }: AddVehicleModalProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos or camera');
        return;
      }

      // Launch picker
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose photo source',
      [
        { text: 'Camera', onPress: () => pickImage(true) },
        { text: 'Gallery', onPress: () => pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAdd = async () => {
    if (!make || !model || !year) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    let photoUrl: string | undefined;

    // Upload photo if selected
    if (photoUri) {
      setUploading(true);
      try {
        // Generate temporary vehicle ID for upload
        const tempVehicleId = `temp_${Date.now()}`;
        photoUrl = await uploadVehiclePhoto(tempVehicleId, photoUri);
      } catch (error) {
        setUploading(false);
        Alert.alert(
          'Upload Error',
          'Failed to upload photo. Would you like to retry or continue without the photo?',
          [
            { text: 'Retry', onPress: () => handleAdd() },
            { text: 'Continue Without Photo', onPress: () => {
              setPhotoUri(null);
              handleAdd();
            }},
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
      setUploading(false);
    }

    onAdd({ make, model, year: yearNum, vin: vin || undefined, photoUrl });
    
    // Reset form
    setMake('');
    setModel('');
    setYear('');
    setVin('');
    setPhotoUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={uploading}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Vehicle</Text>
          <TouchableOpacity onPress={handleAdd} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Photo Upload Section */}
          <Text style={styles.label}>Vehicle Photo</Text>
          <TouchableOpacity 
            style={styles.photoButton} 
            onPress={showImageSourceOptions}
            disabled={uploading}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#999" />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {photoUri && (
            <TouchableOpacity 
              style={styles.removePhotoButton}
              onPress={() => setPhotoUri(null)}
              disabled={uploading}
            >
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.label}>Make *</Text>
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholder="e.g., Toyota"
            editable={!uploading}
          />
          
          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="e.g., Camry"
            editable={!uploading}
          />
          
          <Text style={styles.label}>Year *</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder="e.g., 2023"
            keyboardType="numeric"
            editable={!uploading}
          />
          
          <Text style={styles.label}>VIN (Optional)</Text>
          <TextInput
            style={styles.input}
            value={vin}
            onChangeText={setVin}
            placeholder="17-character VIN"
            maxLength={17}
            editable={!uploading}
          />
          
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.uploadingText}>Uploading photo...</Text>
            </View>
          )}
          
          <View style={{ height: 40 }} />
        </ScrollView>
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
  photoButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 8,
  },
  photoPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    alignSelf: 'center',
    padding: 8,
    marginBottom: 8,
  },
  removePhotoText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 16,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});