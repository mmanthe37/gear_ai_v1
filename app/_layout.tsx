import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';
import MockDataBanner from '../components/MockDataBanner';
import { AuthProvider } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function RootLayout() {
  // Log app startup
  useEffect(() => {
    console.log('🚀 Gear AI CoPilot is running');
    console.log('Platform:', Platform.OS);
    console.log('Environment:', process.env.NODE_ENV || 'development');
  }, []);

  // Show demo banner in development or when explicitly enabled
  const showDemoBanner = process.env.NODE_ENV !== 'production' || 
                        process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

  return (
    <ErrorBoundary>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          {showDemoBanner && <MockDataBanner />}
          <StatusBar style="light" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen 
              name="chat/[id]" 
              options={{ 
                presentation: 'modal',
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff',
              }} 
            />
          </Stack>
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}