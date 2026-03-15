import { Tabs } from "expo-router";
import PremiumTabBar from "../../components/PremiumTabBar";
import { ProfileProvider } from "../../context/ProfileContext";

export default function PatientLayout() {
  return (
    <ProfileProvider>
      <Tabs
        tabBar={(props) => <PremiumTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="nutrition" />
        <Tabs.Screen name="exercise" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </ProfileProvider>
  );
}