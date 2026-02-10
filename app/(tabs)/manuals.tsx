import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AnimatedBackground from '../../components/AnimatedBackground';
import {
  retrieveManual,
  getRecalls,
  getSafetyRatings,
  getVehicleReport,
  resolveVehicle,
} from '../../services/manual-retrieval';
import type {
  ManualRetrievalResult,
  RecallResult,
  SafetyRatingResult,
  VehicleLookup,
  VehicleReport,
} from '../../types/manual';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LookupMode = 'vin' | 'manual';

interface RetrievedManual {
  id: string;
  vehicle: VehicleLookup;
  result: ManualRetrievalResult;
  recalls?: RecallResult;
  safety?: SafetyRatingResult;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ManualsScreen() {
  const [lookupMode, setLookupMode] = useState<LookupMode>('vin');
  const [vinInput, setVinInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [makeInput, setMakeInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrieved, setRetrieved] = useState<RetrievedManual[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ------- Lookup handlers -------

  const handleVinLookup = useCallback(async () => {
    const vin = vinInput.trim().toUpperCase();
    if (vin.length !== 17) {
      setError('VIN must be exactly 17 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const report = await getVehicleReport(vin);
      const entry: RetrievedManual = {
        id: `${Date.now()}`,
        vehicle: report.vehicle,
        result: report.manual,
        recalls: report.recalls,
        safety: report.safety,
      };
      setRetrieved((prev) => [entry, ...prev]);
      setVinInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to look up VIN.');
    } finally {
      setLoading(false);
    }
  }, [vinInput]);

  const handleManualLookup = useCallback(async () => {
    const year = parseInt(yearInput.trim(), 10);
    if (!year || year < 1990 || year > 2030) {
      setError('Enter a valid model year (1990-2030).');
      return;
    }
    if (!makeInput.trim() || !modelInput.trim()) {
      setError('Make and Model are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const vehicle: VehicleLookup = {
        year,
        make: makeInput.trim(),
        model: modelInput.trim(),
      };
      const report = await getVehicleReport(vehicle);
      const entry: RetrievedManual = {
        id: `${Date.now()}`,
        vehicle: report.vehicle,
        result: report.manual,
        recalls: report.recalls,
        safety: report.safety,
      };
      setRetrieved((prev) => [entry, ...prev]);
      setYearInput('');
      setMakeInput('');
      setModelInput('');
    } catch (err: any) {
      setError(err.message || 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  }, [yearInput, makeInput, modelInput]);

  const handleOpenManual = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot Open', 'Unable to open the manual URL.')
    );
  }, []);

  const handleAskAboutManual = useCallback(
    (manual: RetrievedManual) => {
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: `manual-${manual.id}`,
          make: manual.vehicle.make,
          model: manual.vehicle.model,
          year: manual.vehicle.year.toString(),
        },
      });
    },
    []
  );

  // ------- Sub-components -------

  const ModeToggle = () => (
    <View style={styles.modeToggleRow}>
      <TouchableOpacity
        style={[styles.modeButton, lookupMode === 'vin' && styles.modeButtonActive]}
        onPress={() => setLookupMode('vin')}
      >
        <Text style={[styles.modeButtonText, lookupMode === 'vin' && styles.modeButtonTextActive]}>
          VIN Lookup
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, lookupMode === 'manual' && styles.modeButtonActive]}
        onPress={() => setLookupMode('manual')}
      >
        <Text style={[styles.modeButtonText, lookupMode === 'manual' && styles.modeButtonTextActive]}>
          Year / Make / Model
        </Text>
      </TouchableOpacity>
    </View>
  );

  const VinForm = () => (
    <View style={styles.formContainer}>
      <BlurView intensity={15} tint="light" style={styles.inputBlur}>
        <View style={styles.inputRow}>
          <Ionicons name="car-sport" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter 17-digit VIN..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={vinInput}
            onChangeText={setVinInput}
            autoCapitalize="characters"
            maxLength={17}
          />
        </View>
      </BlurView>
      <TouchableOpacity
        style={[styles.lookupButton, loading && styles.lookupButtonDisabled]}
        onPress={handleVinLookup}
        disabled={loading}
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.lookupGradient}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.lookupButtonText}>Retrieve Manual</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const ManualForm = () => (
    <View style={styles.formContainer}>
      <BlurView intensity={15} tint="light" style={styles.inputBlur}>
        <View style={styles.inputRow}>
          <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.textInput}
            placeholder="Year (e.g. 2023)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={yearInput}
            onChangeText={setYearInput}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </BlurView>
      <BlurView intensity={15} tint="light" style={[styles.inputBlur, { marginTop: 10 }]}>
        <View style={styles.inputRow}>
          <Ionicons name="construct" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.textInput}
            placeholder="Make (e.g. Toyota)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={makeInput}
            onChangeText={setMakeInput}
            autoCapitalize="words"
          />
        </View>
      </BlurView>
      <BlurView intensity={15} tint="light" style={[styles.inputBlur, { marginTop: 10 }]}>
        <View style={styles.inputRow}>
          <Ionicons name="speedometer" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.textInput}
            placeholder="Model (e.g. Camry)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={modelInput}
            onChangeText={setModelInput}
            autoCapitalize="words"
          />
        </View>
      </BlurView>
      <TouchableOpacity
        style={[styles.lookupButton, loading && styles.lookupButtonDisabled]}
        onPress={handleManualLookup}
        disabled={loading}
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.lookupGradient}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.lookupButtonText}>Retrieve Manual</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const RecallBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <View style={styles.recallBadge}>
        <Ionicons name="warning" size={12} color="#FF6B35" />
        <Text style={styles.recallBadgeText}>
          {count} Recall{count > 1 ? 's' : ''}
        </Text>
      </View>
    ) : (
      <View style={[styles.recallBadge, { backgroundColor: 'rgba(46,204,113,0.2)' }]}>
        <Ionicons name="checkmark-circle" size={12} color="#2ecc71" />
        <Text style={[styles.recallBadgeText, { color: '#2ecc71' }]}>No Recalls</Text>
      </View>
    );

  const SourceBadge = ({ source }: { source: string }) => {
    const labels: Record<string, string> = {
      vehicledatabases: 'VehicleDatabases',
      oem_fallback: 'OEM Direct',
      web_search: 'Web Search',
      cache: 'Cached',
      nhtsa_cache: 'NHTSA',
    };
    return (
      <View style={styles.sourceBadge}>
        <Text style={styles.sourceBadgeText}>{labels[source] || source}</Text>
      </View>
    );
  };

  const ManualCard = ({ entry }: { entry: RetrievedManual }) => (
    <View style={styles.manualCard}>
      <BlurView intensity={20} tint="light" style={styles.cardBlur}>
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.bookIconContainer}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.bookIcon}>
                  <Ionicons name="book" size={20} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.manualInfo}>
                <Text style={styles.manualTitle}>
                  {entry.vehicle.make} {entry.vehicle.model}
                </Text>
                <Text style={styles.manualYear}>{entry.vehicle.year} Model Year</Text>
              </View>
            </View>

            {/* Badges row */}
            <View style={styles.badgeRow}>
              <SourceBadge source={entry.result.source} />
              <RecallBadge count={entry.recalls?.count || 0} />
            </View>

            {/* Safety rating */}
            {entry.safety && entry.safety.ratings.length > 0 && (
              <View style={styles.safetyRow}>
                <Text style={styles.safetyLabel}>NHTSA Safety:</Text>
                <Text style={styles.safetyValue}>
                  {entry.safety.ratings[0].OverallRating !== 'Not Rated'
                    ? `${entry.safety.ratings[0].OverallRating}/5 Stars`
                    : 'Not Rated'}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
              {entry.result.manual_url && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenManual(entry.result.manual_url!)}
                >
                  <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionGradient}>
                    <Ionicons name="download" size={16} color="white" />
                    <Text style={styles.actionText}>
                      {entry.result.source === 'web_search' ? 'Search PDF' : 'View PDF'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAskAboutManual(entry)}
              >
                <LinearGradient colors={['#36D1DC', '#5B86E5']} style={styles.actionGradient}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="white" />
                  <Text style={styles.actionText}>Ask AI</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Recall details (collapsed by default, show first one) */}
            {entry.recalls && entry.recalls.count > 0 && (
              <View style={styles.recallSection}>
                <Text style={styles.recallSectionTitle}>Latest Recall</Text>
                <Text style={styles.recallComponent}>
                  {entry.recalls.recalls[0].Component}
                </Text>
                <Text style={styles.recallSummary} numberOfLines={3}>
                  {entry.recalls.recalls[0].Summary}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );

  // ------- Render -------

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{"Owner's Manuals"}</Text>
          <Text style={styles.subtitle}>
            Retrieve manuals, recalls, and safety data
          </Text>
        </View>

        <ModeToggle />

        {lookupMode === 'vin' ? <VinForm /> : <ManualForm />}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#FF6B35" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        <View style={styles.resultsContainer}>
          {retrieved.map((entry) => (
            <ManualCard key={entry.id} entry={entry} />
          ))}
        </View>

        {retrieved.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>No manuals retrieved yet</Text>
            <Text style={styles.emptySubtext}>
              Enter a VIN or vehicle details above to retrieve an owner's manual,
              recall history, and safety ratings.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  header: { paddingVertical: 30, paddingTop: 50 },
  title: { fontSize: 32, fontWeight: '800', color: 'white', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  // Mode toggle
  modeToggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(102,126,234,0.6)',
  },
  modeButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: 'white',
  },

  // Form
  formContainer: { marginBottom: 20 },
  inputBlur: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
  },
  lookupButton: {
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  lookupButtonDisabled: { opacity: 0.6 },
  lookupGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  lookupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.15)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },

  // Results
  resultsContainer: { marginBottom: 20 },
  manualCard: {
    marginBottom: 14,
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
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardGradient: { borderRadius: 16 },
  cardContent: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookIconContainer: { marginRight: 12 },
  bookIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualInfo: { flex: 1 },
  manualTitle: { fontSize: 17, fontWeight: '700', color: 'white', marginBottom: 3 },
  manualYear: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  // Badges
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  sourceBadge: {
    backgroundColor: 'rgba(102,126,234,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceBadgeText: { color: '#a4b8ff', fontSize: 12, fontWeight: '600' },
  recallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  recallBadgeText: { color: '#FF6B35', fontSize: 12, fontWeight: '600' },

  // Safety
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  safetyLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  safetyValue: { color: 'white', fontSize: 13, fontWeight: '600' },

  // Actions
  cardActions: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  actionButton: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // Recall section
  recallSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  recallSectionTitle: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  recallComponent: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  recallSummary: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 17,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
