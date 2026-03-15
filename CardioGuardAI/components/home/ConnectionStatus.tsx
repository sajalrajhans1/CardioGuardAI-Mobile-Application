import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../../constants/theme";
import { useECGStream } from "../../hooks/useECGStream";

export default function ConnectionStatus() {
  const { connected, leadOff } = useECGStream();

  /* A signal-timeout or lead_off both set connected=false / leadOff=true */
  const isActive  = connected && !leadOff;
  const dotColor  = isActive ? colors.success : colors.danger;
  const softColor = isActive ? colors.successSoft : colors.dangerSoft;

  const statusText  = isActive ? "Strap Connected"        : "Electrodes Not Attached";
  const statusBadge = isActive ? "ACTIVE"                 : "INACTIVE";

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.card}>
      {/* Medical ECG icon — not Bluetooth */}
      <View style={[styles.iconWrap, { backgroundColor: softColor }]}>
        <Feather name="activity" size={18} color={dotColor} />
      </View>

      <View style={styles.info}>
        <Text style={styles.label}>Device Status</Text>
        <Text style={styles.status}>{statusText}</Text>
        <View style={[styles.pill, { backgroundColor: softColor }]}>
          <Text style={[styles.pillText, { color: dotColor }]}>{statusBadge}</Text>
        </View>
      </View>

      {/* Pulsing dot */}
      <View style={styles.dotWrap}>
        <Animated.View
          style={[
            styles.dotRing,
            { backgroundColor: dotColor + "30", transform: [{ scale: pulse }] },
          ]}
        />
        <View style={[styles.dotCore, { backgroundColor: dotColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
    shadowOffset: { width: 0, height: 4 },
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  status: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 5,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  dotWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  dotRing: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  dotCore: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
});