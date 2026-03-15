import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../../constants/theme";
import { useECGStream } from "../../hooks/useECGStream";

const BPM_MIN = 45;
const BPM_MAX = 120;

function classifyBPM(bpm: number, connected: boolean): {
  label: string;
  accent: string;
  soft: string;
} {
  if (!connected || bpm === 0) {
    return { label: "No signal", accent: colors.textSecondary, soft: "#F1F5F9" };
  }
  if (bpm > 140) return { label: "Critical — seek help immediately", accent: colors.danger, soft: colors.dangerSoft };
  if (bpm > 120) return { label: "Tachycardia detected",             accent: colors.danger, soft: colors.dangerSoft };
  if (bpm < 45)  return { label: "Bradycardia detected",             accent: colors.danger, soft: colors.dangerSoft };
  if (bpm > 100) return { label: "Slightly elevated",                accent: "#F59E0B",     soft: "#FFFBEB" };
  return               { label: "Rhythm within normal range",        accent: colors.success, soft: colors.successSoft };
}

export default function HeartRateSection() {
  /* Fix 2 — pull real BPM from the hook */
  const { bpm, connected } = useECGStream();

  const { label, accent, soft } = classifyBPM(bpm, connected);

  /* Beat animation — synced to live BPM when available */
  const beat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const intervalMs = bpm > 0 && connected ? (60 / bpm) * 1000 : 900;

    const doPulse = () => {
      Animated.sequence([
        Animated.timing(beat, { toValue: 1.2,  duration: 100, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1,    duration: 100, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1.12, duration: 90,  useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1,    duration: 160, useNativeDriver: true }),
      ]).start();
    };

    doPulse();
    const id = setInterval(doPulse, intervalMs);
    return () => clearInterval(id);
  }, [bpm, connected]);

  const rangeProgress = bpm > 0 && connected
    ? Math.min(1, Math.max(0, (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)))
    : 0;

  /* Fix 2 — display format: "78 BPM" when connected, "-- BPM" when not */
  const displayBpm = connected && bpm > 0 ? String(bpm) : "--";

  return (
    <View style={styles.card}>
      {/* Left accent stripe */}
      <View style={[styles.stripe, { backgroundColor: accent }]} />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: soft }]}>
            <Feather name="activity" size={16} color={accent} />
          </View>
          <Text style={styles.label}>HEART RATE</Text>
          {!connected && (
            <View style={styles.frozenBadge}>
              <Text style={styles.frozenText}>SIGNAL LOST</Text>
            </View>
          )}
        </View>

        {/* BPM display */}
        <View style={styles.bpmRow}>
          <Animated.View style={{ transform: [{ scale: beat }] }}>
            <Feather name="heart" size={32} color={accent} />
          </Animated.View>
          <View style={styles.bpmTextWrap}>
            <Text style={[styles.bpmValue, !connected && styles.bpmDimmed]}>
              {displayBpm}
            </Text>
            <Text style={styles.bpmUnit}>BPM</Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: soft }]}>
          <View style={[styles.statusDot, { backgroundColor: accent }]} />
          <Text style={[styles.statusText, { color: accent }]}>{label}</Text>
        </View>

        {/* Range bar */}
        <View style={styles.rangeRow}>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>MIN</Text>
            <Text style={styles.rangeValue}>{BPM_MIN}</Text>
          </View>
          <View style={styles.rangeBar}>
            <View
              style={[
                styles.rangeProgress,
                { width: `${rangeProgress * 100}%`, backgroundColor: accent },
              ]}
            />
          </View>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>MAX</Text>
            <Text style={styles.rangeValue}>{BPM_MAX}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.card,
    shadowOffset: { width: 0, height: 5 },
  },
  stripe: { width: 5 },
  body: { flex: 1, padding: spacing.md },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    flex: 1,
  },
  frozenBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  frozenText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.danger,
    letterSpacing: 0.5,
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: spacing.sm,
  },
  bpmTextWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  bpmValue: {
    fontSize: 52,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 56,
  },
  bpmDimmed: {
    color: colors.textSecondary,
  },
  bpmUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rangeItem: {
    alignItems: "center",
    minWidth: 28,
  },
  rangeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  rangeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rangeBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  rangeProgress: {
    height: "100%",
    borderRadius: 3,
  },
});