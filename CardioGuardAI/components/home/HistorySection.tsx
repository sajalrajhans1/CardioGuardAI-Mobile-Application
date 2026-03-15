import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export type HistoryEventKind = "tachycardia" | "bradycardia" | "ecg_recording" | "elevated";

export interface HistoryEvent {
  type:      HistoryEventKind;
  bpm:       number;
  timestamp: Date;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getEventColor(type: HistoryEventKind): string {
  switch (type) {
    case "tachycardia":   return colors.danger;
    case "bradycardia":   return colors.danger;
    case "elevated":      return "#F59E0B";
    case "ecg_recording": return colors.primary;
  }
}

function getEventIcon(type: HistoryEventKind): React.ComponentProps<typeof Feather>["name"] {
  switch (type) {
    case "tachycardia":   return "alert-circle";
    case "bradycardia":   return "alert-circle";
    case "elevated":      return "alert-triangle";
    case "ecg_recording": return "file-text";
  }
}

function getEventLabel(type: HistoryEventKind): string {
  switch (type) {
    case "tachycardia":   return "Tachycardia Detected";
    case "bradycardia":   return "Bradycardia Detected";
    case "elevated":      return "Elevated Heart Rate";
    case "ecg_recording": return "ECG Report Recorded";
  }
}

function getSeverityLabel(type: HistoryEventKind): string {
  switch (type) {
    case "tachycardia":   return "Critical severity";
    case "bradycardia":   return "Critical severity";
    case "elevated":      return "Elevated severity";
    case "ecg_recording": return "Manual recording";
  }
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
interface Props {
  events: HistoryEvent[];
  loading?: boolean;
}

export default function HistorySection({ events, loading = false }: Props) {
  const shimmer = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: width, duration: 1400, useNativeDriver: true })
    ).start();
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "65%", marginTop: 10 }]} />
        <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmer }] }]}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.45)", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.shimmerGrad}
          />
        </Animated.View>
      </View>
    );
  }

  /* ── Empty state ── */
  if (events.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyWrap}>
          <Feather name="check-circle" size={28} color={colors.success} />
          <Text style={styles.emptyTitle}>All Clear</Text>
          <Text style={styles.emptySubtitle}>No cardiac events recorded yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {events.map((ev, idx) => {
        const color   = getEventColor(ev.type);
        const icon    = getEventIcon(ev.type);
        const evLabel = getEventLabel(ev.type);
        const sevLabel = getSeverityLabel(ev.type);
        const isLast   = idx === events.length - 1;

        return (
          <View key={idx} style={[styles.row, isLast && styles.rowLast]}>
            {/* Timeline spine */}
            <View style={styles.spine}>
              <View style={[styles.dot, { backgroundColor: color, borderColor: color + "35" }]} />
              {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
            </View>

            {/* Content */}
            <View style={[styles.content, !isLast && styles.contentBorder]}>
              <View style={styles.topRow}>
                <View style={[styles.iconWrap, { backgroundColor: color + "18" }]}>
                  <Feather name={icon} size={13} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventType}>{evLabel}</Text>
                  <Text style={styles.timestamp}>
                    {ev.timestamp.toLocaleString(undefined, {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </Text>
                </View>
                {ev.bpm > 0 && (
                  <View style={[styles.bpmBadge, { backgroundColor: color + "18" }]}>
                    <Text style={[styles.bpmText, { color }]}>{ev.bpm} BPM</Text>
                  </View>
                )}
              </View>

              <View style={[styles.severityRow, { backgroundColor: color + "10" }]}>
                <View style={[styles.severityDot, { backgroundColor: color }]} />
                <Text style={[styles.severityLabel, { color }]}>{sevLabel}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
    shadowOffset: { width: 0, height: 5 },
  },
  row: { flexDirection: "row" },
  rowLast: {},
  spine: { width: 28, alignItems: "center" },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginTop: 12,
    zIndex: 1,
  },
  line: { flex: 1, width: 2, minHeight: 20, marginTop: 2, backgroundColor: colors.border },
  content: { flex: 1, paddingBottom: spacing.md, paddingLeft: 8 },
  contentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  bpmBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  bpmText: { fontSize: 12, fontWeight: "700" },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 2,
  },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
  severityLabel: { fontSize: 11, fontWeight: "600" },

  /* Empty state */
  emptyWrap: { alignItems: "center", paddingVertical: spacing.xl, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  emptySubtitle: { fontSize: 13, color: colors.textSecondary },

  /* Skeleton */
  skeletonCard: {
    backgroundColor: "#E9EFF8",
    borderRadius: radius.lg,
    height: 120,
    marginBottom: spacing.md,
    padding: spacing.md,
    overflow: "hidden",
  },
  skeletonLine: { height: 14, width: "80%", backgroundColor: "#D5DDE9", borderRadius: 7 },
  shimmerOverlay: { ...StyleSheet.absoluteFillObject },
  shimmerGrad: { width: 180, height: "100%" },
});