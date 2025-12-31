import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            presentation: 'modal',
            headerStyle: { backgroundColor: '#007AFF' },
            headerTintColor: '#fff',
          }} 
        />
      </Stack>
    </ErrorBoundary>
  );
}