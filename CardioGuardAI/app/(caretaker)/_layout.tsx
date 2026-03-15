import { Stack } from "expo-router";

export default function CaretakerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)"          />
      <Stack.Screen name="connect-patient" />
    </Stack>
  );
}