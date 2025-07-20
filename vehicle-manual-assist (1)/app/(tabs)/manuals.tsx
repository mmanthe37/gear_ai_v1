import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AnimatedBackground from '../../components/AnimatedBackground';

interface Manual {
  id: string;
  make: string;
  model: string;
  year: number;
  pages: number;
}

export default function ManualsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [manuals] = useState<Manual[]>([
    { id: '1', make: 'Toyota', model: 'Camry', year: 2023, pages: 542 },
    { id: '2', make: 'Honda', model: 'Civic', year: 2022, pages: 486 },
    { id: '3', make: 'Ford', model: 'F-150', year: 2023, pages: 628 },
    { id: '4', make: 'BMW', model: '3 Series', year: 2022, pages: 394 },
    { id: '5', make: 'Mercedes', model: 'C-Class', year: 2023, pages: 456 },
  ]);

  const filteredManuals = manuals.filter(manual => {
    const query = searchQuery.toLowerCase();
    return (
      manual.make.toLowerCase().includes(query) ||
      manual.model.toLowerCase().includes(query) ||
      manual.year.toString().includes(query)
    );
  });

  const handleManualPress = (manual: Manual) => {
    router.push({
      pathname: '/chat/[id]',
      params: { 
        id: `manual-${manual.id}`,
        make: manual.make,
        model: manual.model,
        year: manual.year.toString(),
      },
    });
  };

  const ManualCard = ({ manual }: { manual: Manual }) => (
    <TouchableOpacity
      style={styles.manualCard}
      onPress={() => handleManualPress(manual)}
    >
      <BlurView intensity={20} tint="light" style={styles.cardBlur}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.25)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.05)'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.bookIconContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.bookIcon}
                >
                  <Ionicons name="book" size={20} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.manualInfo}>
                <Text style={styles.manualTitle}>{manual.make} {manual.model}</Text>
                <Text style={styles.manualYear}>{manual.year} Model Year</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.pagesText}>{manual.pages} pages</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Owner's Manuals</Text>
          <Text style={styles.subtitle}>Access comprehensive vehicle guides</Text>
        </View>

        <View style={styles.searchContainer}>
          <BlurView intensity={15} tint="light" style={styles.searchBlur}>
            <View style={styles.searchInput}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.searchText}
                placeholder="Search manuals..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </BlurView>
        </View>

        <View style={styles.manualsContainer}>
          {filteredManuals.map((manual) => (
            <ManualCard key={manual.id} manual={manual} />
          ))}
        </View>

        {filteredManuals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>No manuals found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
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
  searchContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchBlur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
  },
  manualsContainer: {
    marginBottom: 20,
  },
  manualCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardBlur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookIconContainer: {
    marginRight: 12,
  },
  bookIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualInfo: {
    flex: 1,
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  manualYear: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pagesText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
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