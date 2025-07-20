import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
    </>
  );
}