import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/theme";
import { ProfileContext } from "../../context/ProfileContext";

export default function GreetingSection() {
  const { profile } = useContext(ProfileContext);

  const firstName =
    profile?.personalInfo?.fullName?.split(" ")[0] ?? "Patient";

  const now  = new Date();
  const hour = now.getHours();

  const greeting =
    hour >= 5  && hour < 12 ? "Good Morning"
    : hour >= 12 && hour < 17 ? "Good Afternoon"
    : hour >= 17 && hour < 22 ? "Good Evening"
    : "Good Night";

  const greetIcon =
    hour >= 5  && hour < 12 ? "sun"
    : hour >= 12 && hour < 17 ? "cloud"
    : hour >= 17 && hour < 22 ? "sunset"
    : "moon" as React.ComponentProps<typeof Feather>["name"];

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{dateStr}</Text>

      <View style={styles.greetRow}>
        <Feather name={greetIcon} size={22} color={colors.primary} style={styles.icon} />
        <Text style={styles.greeting}>
          {greeting}, <Text style={styles.name}>{firstName}</Text>
        </Text>
      </View>

      <Text style={styles.sub}>Cardiac monitoring dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  greetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  icon: {
    marginRight: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  name: {
    fontWeight: "800",
    color: colors.primary,
  },
  sub: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "400",
  },
});