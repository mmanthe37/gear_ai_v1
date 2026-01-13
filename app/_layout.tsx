import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
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
      </AuthProvider>
    </ErrorBoundary>
  );
}