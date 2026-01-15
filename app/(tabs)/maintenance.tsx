import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AnimatedBackground from '../../components/AnimatedBackground';
import ModernServiceCard from '../../components/ModernServiceCard';
import { uploadMaintenanceReceipt } from '../../services/storage-service';

interface ServiceReminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  vehicle: string;
  completed: boolean;
  photoUrl?: string;
}

export default function MaintenanceScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceReminder[]>([
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

  const AddServiceModal = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async (useCamera: boolean) => {
      try {
        const permissionResult = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please grant permission to access your photos or camera');
          return;
        }

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
        'Add Receipt Photo',
        'Choose photo source',
        [
          { text: 'Camera', onPress: () => pickImage(true) },
          { text: 'Gallery', onPress: () => pickImage(false) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    };

    const handleSave = async () => {
      if (!title) {
        Alert.alert('Error', 'Please enter a service title');
        return;
      }

      let photoUrl: string | undefined;

      if (photoUri) {
        setUploading(true);
        try {
          const tempRecordId = `temp_${Date.now()}`;
          photoUrl = await uploadMaintenanceReceipt(tempRecordId, photoUri);
        } catch (error) {
          setUploading(false);
          Alert.alert(
            'Upload Error',
            'Failed to upload photo. Would you like to retry or continue without the photo?',
            [
              { text: 'Retry', onPress: () => handleSave() },
              { text: 'Continue Without Photo', onPress: () => {
                setPhotoUri(null);
                handleSave();
              }},
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }
        setUploading(false);
      }

      // Add new service
      const newService: ServiceReminder = {
        id: `${Date.now()}`,
        title,
        description,
        dueDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        priority: 'medium',
        vehicle: 'Toyota Camry 2023',
        completed: false,
        photoUrl,
      };

      setServices([newService, ...services]);
      setTitle('');
      setDescription('');
      setPhotoUri(null);
      setShowAddModal(false);
    };

    return (
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} disabled={uploading}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Service Record</Text>
            <TouchableOpacity onPress={handleSave} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>Receipt Photo</Text>
            <TouchableOpacity 
              style={styles.photoButton} 
              onPress={showImageSourceOptions}
              disabled={uploading}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.photoPlaceholderText}>Add Receipt Photo</Text>
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

            <Text style={styles.modalLabel}>Service Title *</Text>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Oil Change"
              placeholderTextColor="rgba(255,255,255,0.5)"
              editable={!uploading}
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              numberOfLines={4}
              editable={!uploading}
            />

            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.uploadingText}>Uploading receipt...</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const PhotoViewModal = () => (
    <Modal visible={!!selectedPhoto} animationType="fade" transparent>
      <TouchableOpacity 
        style={styles.photoViewContainer}
        activeOpacity={1}
        onPress={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoViewHeader}>
          <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        {selectedPhoto && (
          <Image source={{ uri: selectedPhoto }} style={styles.fullPhoto} resizeMode="contain" />
        )}
      </TouchableOpacity>
    </Modal>
  );

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
      
      <AddServiceModal />
      <PhotoViewModal />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Maintenance</Text>
            <Text style={styles.subtitle}>Keep your vehicles in top condition</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <FilterButton type="all" label="All" />
          <FilterButton type="pending" label="Pending" />
          <FilterButton type="completed" label="Completed" />
        </View>

        <View style={styles.servicesContainer}>
          {filteredServices.map((service) => (
            <View key={service.id}>
              <ModernServiceCard
                title={service.title}
                description={service.description}
                dueDate={service.dueDate}
                priority={service.priority}
                vehicle={service.vehicle}
              />
              {service.photoUrl && (
                <TouchableOpacity 
                  style={styles.thumbnailContainer}
                  onPress={() => setSelectedPhoto(service.photoUrl || null)}
                >
                  <Image source={{ uri: service.photoUrl }} style={styles.thumbnail} />
                  <View style={styles.thumbnailOverlay}>
                    <Ionicons name="expand-outline" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  thumbnailContainer: {
    marginTop: -12,
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 8,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalForm: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 8,
  },
  photoPlaceholder: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  photoPreview: {
    width: '100%',
    height: 150,
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  photoViewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  photoViewHeader: {
    padding: 16,
    paddingTop: 50,
    alignItems: 'flex-end',
  },
  fullPhoto: {
    flex: 1,
    width: '100%',
  },
});