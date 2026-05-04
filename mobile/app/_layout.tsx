import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="new-trip" />
        <Stack.Screen name="trip/[id]" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
