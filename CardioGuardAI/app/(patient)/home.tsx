import React, { useCallback, useContext, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import HeartRateSection from "../../components/home/HeartRateSection";
import ECGSection from "../../components/home/ECGSection";
import HistorySection, { HistoryEvent } from "../../components/home/HistorySection";
import NearbyHospitalsSection from "../../components/home/NearbyHospitalsSection";

import { useECGStream, ArrhythmiaEvent } from "../../hooks/useECGStream";
import { generateECGPDF, createECGRecorder } from "../../utils/ecgRecorder";
import { colors, spacing, radius, shadows } from "../../constants/theme";
import { ProfileContext } from "../../context/ProfileContext";

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const PATIENT_ID = "CG-AI-10234";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface AlertInfo {
  type:       "tachycardia" | "bradycardia";
  bpm:        number;
  detectedAt: Date;
}

/* ─────────────────────────────────────────────
   PULSING DOT
───────────────────────────────────────────── */
function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.65, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={dotSt.wrap}>
      <Animated.View style={[dotSt.ring, { backgroundColor: color + "35", transform: [{ scale: pulse }] }]} />
      <View style={[dotSt.core, { backgroundColor: color }]} />
    </View>
  );
}
const dotSt = StyleSheet.create({
  wrap: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 20, height: 20, borderRadius: 10 },
  core: { width: 10, height: 10, borderRadius: 5 },
});

/* ─────────────────────────────────────────────
   DEVICE STATUS CARD  (USB / medical icon)
───────────────────────────────────────────── */
function DeviceStatusCard({ connected }: { connected: boolean }) {
  const dotColor = connected ? colors.success : colors.danger;
  const bgColor  = connected ? colors.successSoft : colors.dangerSoft;
  return (
    <View style={dvcSt.card}>
      <View style={[dvcSt.iconWrap, { backgroundColor: bgColor }]}>
        <Feather name="activity" size={18} color={dotColor} />
      </View>
      <View style={dvcSt.info}>
        <Text style={dvcSt.label}>Device Status</Text>
        <Text style={dvcSt.name}>
          {connected ? "Strap Connected" : "Electrodes Not Attached"}
        </Text>
      </View>
      <View style={dvcSt.right}>
        <PulsingDot color={dotColor} />
        <View style={[dvcSt.pill, { backgroundColor: bgColor }]}>
          <Text style={[dvcSt.pillText, { color: dotColor }]}>
            {connected ? "ACTIVE" : "INACTIVE"}
          </Text>
        </View>
      </View>
    </View>
  );
}
const dvcSt = StyleSheet.create({
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
  iconWrap: { width: 44, height: 44, borderRadius: radius.sm, justifyContent: "center", alignItems: "center", marginRight: spacing.md },
  info: { flex: 1 },
  label: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  name: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  right: { alignItems: "center", gap: 6 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
});

/* ─────────────────────────────────────────────
   AI ALERT CARD
───────────────────────────────────────────── */
function AIAlertCard({
  alert,
  onDismiss,
}: {
  alert: AlertInfo;
  onDismiss: () => void;
}) {
  const isTaghy    = alert.type === "tachycardia";
  const minutesAgo = Math.floor((Date.now() - alert.detectedAt.getTime()) / 60_000);
  const timeLabel  = minutesAgo < 1 ? "just now" : `${minutesAgo} min ago`;

  return (
    <View style={altSt.outer}>
      <View style={altSt.accentBar} />
      <View style={altSt.inner}>
        <View style={altSt.topRow}>
          <View style={altSt.iconWrap}>
            <Feather name="alert-triangle" size={17} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={altSt.title}>
              {isTaghy ? "Tachycardia Detected" : "Bradycardia Detected"}
            </Text>
            <Text style={altSt.subtitle}>
              {alert.bpm} BPM — pattern noted {timeLabel}
            </Text>
          </View>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={16} color="#B91C1C" />
          </TouchableOpacity>
        </View>
        <Text style={altSt.hint}>
          Use "Record ECG Report" in the ECG Monitor to capture a waveform for your doctor.
        </Text>
      </View>
    </View>
  );
}
const altSt = StyleSheet.create({
  outer: {
    flexDirection: "row",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FECACA",
    ...shadows.card,
    shadowOffset: { width: 0, height: 4 },
  },
  accentBar: { width: 5, backgroundColor: colors.danger },
  inner: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 11, marginBottom: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center", marginTop: 1 },
  title:    { fontSize: 15, fontWeight: "800", color: "#991B1B", letterSpacing: -0.2, marginBottom: 3 },
  subtitle: { fontSize: 13, color: "#B91C1C", lineHeight: 18 },
  hint:     { fontSize: 12, color: "#B91C1C", opacity: 0.75, lineHeight: 17 },
});

/* ─────────────────────────────────────────────
   HERO HEADER
───────────────────────────────────────────── */
function HeroHeader({
  name, patientId, insetTop, wsConnected,
}: {
  name: string; patientId: string; insetTop: number; wsConnected: boolean;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour >= 5  && hour < 12 ? "Good Morning"
    : hour >= 12 && hour < 17 ? "Good Afternoon"
    : hour >= 17 && hour < 22 ? "Good Evening"
    : "Good Night";

  return (
    <ImageBackground
      source={require("../../assets/hero/home-header.jpg")}
      style={[heroSt.hero, { paddingTop: insetTop }]}
    >
      <LinearGradient colors={["rgba(5,20,60,0.08)", "rgba(5,20,60,0.68)"]} style={heroSt.overlay}>
        <View style={heroSt.badgeRow}>
          <View style={heroSt.badge}>
            <Feather name="shield" size={10} color="rgba(255,255,255,0.9)" />
            <Text style={heroSt.badgeText}>CardioGuard AI  ·  Patient Dashboard</Text>
          </View>
          <View style={[heroSt.wsBadge, { backgroundColor: wsConnected ? "#00FF7F22" : "#EF444422" }]}>
            <View style={[heroSt.wsDot, { backgroundColor: wsConnected ? "#00FF7F" : "#EF4444" }]} />
            <Text style={[heroSt.wsText, { color: wsConnected ? "#00FF7F" : "#EF4444" }]}>
              {wsConnected ? "Hardware Live" : "Hardware Offline"}
            </Text>
          </View>
        </View>
        <Text style={heroSt.greeting}>{greeting},</Text>
        <Text style={heroSt.name} numberOfLines={1}>{name}</Text>
        <View style={heroSt.idChip}>
          <Feather name="credit-card" size={11} color="rgba(255,255,255,0.65)" />
          <Text style={heroSt.idText}>ID: {patientId}</Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
const heroSt = StyleSheet.create({
  hero: { width: "100%", height: 240, marginBottom: spacing.lg },
  overlay: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: 26, justifyContent: "flex-end" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 11, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "white", fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  wsBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  wsDot:  { width: 6, height: 6, borderRadius: 3 },
  wsText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  greeting: { color: "rgba(255,255,255,0.78)", fontSize: 14, fontWeight: "400", marginBottom: 2 },
  name:     { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: -0.6, marginBottom: 10 },
  idChip:   { flexDirection: "row", alignItems: "center", gap: 5 },
  idText:   { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "500" },
});

/* ─────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────── */
function SectionHeading({ title, icon }: { title: string; icon: React.ComponentProps<typeof Feather>["name"] }) {
  return (
    <View style={hdgSt.row}>
      <View style={hdgSt.iconWrap}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={hdgSt.title}>{title}</Text>
    </View>
  );
}
const hdgSt = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm, marginTop: spacing.sm },
  iconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primarySoft, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.2 },
});

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
export default function Home() {
  const [refreshing, setRefreshing]       = useState(false);
  const [activeAlert, setActiveAlert]     = useState<AlertInfo | null>(null);
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [criticalRecording, setCriticalRecording] = useState(false);

  const { profile } = useContext(ProfileContext);
  const insets      = useSafeAreaInsets();
  const router      = useRouter();
  const patientName = profile?.personalInfo?.fullName ?? "Patient";

  /* Ref holding the live ECG snapshot for critical recordings */
  const liveEcgRef = useRef<number[]>([]);
  const criticalRecorderRef = useRef<ReturnType<typeof createECGRecorder> | null>(null);

  /* ─────────────────────────────────────────────
     Feature 3 — High BPM (> 120) → navigate to Exercise
  ───────────────────────────────────────────── */
  const handleHighBpm = useCallback((bpm: number) => {
    Alert.alert(
      "High Heart Rate Detected",
      `Your BPM is ${bpm}. Opening the Exercise screen now.`,
      [
        {
          text: "OK",
          onPress: () => {
            router.push("/(patient)/exercise");
            /* Exercise screen will show its own breathing guidance alert */
            setTimeout(() => {
              Alert.alert(
                "Breathing Exercise",
                "Start the breathing exercise to stabilize your heart rate.",
                [{ text: "OK" }]
              );
            }, 800);
          },
        },
      ]
    );
  }, [router]);

  /* ─────────────────────────────────────────────
     Feature 4 — Critical BPM (> 140) → auto ECG record
  ───────────────────────────────────────────── */
  const handleCriticalBpm = useCallback((bpm: number) => {
    if (criticalRecording) return; // already recording
    setCriticalRecording(true);

    Alert.alert(
      "⚠️ Critical Heart Rate",
      `BPM is ${bpm}. Recording ECG for 10 seconds for doctor analysis.`,
      [{ text: "OK" }]
    );

    /* Add to history */
    setHistoryEvents((prev) => [
      { type: "tachycardia", bpm, timestamp: new Date() },
      ...prev,
    ]);

    const recorder = createECGRecorder(10_000);
    criticalRecorderRef.current = recorder;

    recorder.result.then(async (samples) => {
      criticalRecorderRef.current = null;
      try {
        const ecgSamples = samples.length > 0 ? samples : liveEcgRef.current;
        await generateECGPDF(
          {
            patientId:   PATIENT_ID,
            patientName: patientName,
            bpm,
            ecgSamples,
            timestamp:   new Date(),
          },
          true /* isCritical */
        );
        Alert.alert("ECG Saved", "Critical ECG report saved locally for doctor review.");
      } catch {
        /* swallow — critical recording shouldn't block the user */
      } finally {
        setCriticalRecording(false);
      }
    });
  }, [criticalRecording, patientName]);

  /* ─────────────────────────────────────────────
     Arrhythmia callback (tachycardia / bradycardia alert card + history)
  ───────────────────────────────────────────── */
  const handleArrhythmia = useCallback((event: ArrhythmiaEvent) => {
    setActiveAlert({ type: event.type, bpm: event.bpm, detectedAt: event.timestamp });
    setHistoryEvents((prev) => [
      { type: event.type, bpm: event.bpm, timestamp: event.timestamp },
      ...prev,
    ]);
  }, []);

  /* ── ECG stream ── */
  const { bpm, ecg, connected } = useECGStream({
    onArrhythmia:  handleArrhythmia,
    onHighBpm:     handleHighBpm,
    onCriticalBpm: handleCriticalBpm,
  });

  /* Keep live ECG ref up to date for critical recorder */
  React.useEffect(() => {
    liveEcgRef.current = ecg;
    /* Feed live samples into any active critical recorder */
    if (criticalRecorderRef.current && ecg.length > 0) {
      criticalRecorderRef.current.push(ecg[ecg.length - 1]);
    }
  }, [ecg]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <View style={scrnSt.container}>
      <LinearGradient
        colors={[colors.background, "#EBF2FB"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrnSt.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* 1 — Hero (full-width) */}
        <HeroHeader
          name={patientName}
          patientId={PATIENT_ID}
          insetTop={insets.top}
          wsConnected={connected}
        />

        <View style={scrnSt.content}>

          {/* 2 — Device Status */}
          <SectionHeading title="Device Status" icon="activity" />
          <DeviceStatusCard connected={connected} />

          {/* Critical recording banner */}
          {criticalRecording && (
            <View style={scrnSt.criticalBanner}>
              <Feather name="alert-octagon" size={16} color="white" />
              <Text style={scrnSt.criticalText}>
                Critical ECG recording in progress… (10s)
              </Text>
            </View>
          )}

          {/* 3 — AI Alert */}
          {activeAlert && (
            <>
              <SectionHeading title="AI Health Alert" icon="alert-circle" />
              <AIAlertCard alert={activeAlert} onDismiss={() => setActiveAlert(null)} />
            </>
          )}

          {/* 4 — Heart Rate */}
          <SectionHeading title="Heart Rate" icon="heart" />
          <HeartRateSection />

          {/* 5 — ECG Monitor */}
          <SectionHeading title="ECG Monitor" icon="activity" />
          <ECGSection />

          {/* 6 — Medical History */}
          <SectionHeading title="Medical History" icon="clock" />
          <HistorySection events={historyEvents} />

          {/* 7 — Nearby Hospitals */}
          <SectionHeading title="Medical Facilities" icon="map-pin" />
          <NearbyHospitalsSection />

        </View>
      </ScrollView>
    </View>
  );
}

const scrnSt = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { paddingBottom: 130 },
  content:   { paddingHorizontal: spacing.lg },
  criticalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7F1D1D",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  criticalText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
    flex: 1,
  },
});