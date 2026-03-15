import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Path, Line } from "react-native-svg";
import { spacing, radius } from "../../constants/theme";
import { useECGStream } from "../../hooks/useECGStream";
import { generateAndShareECGReport, createECGRecorder } from "../../utils/ecgRecorder";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const SVG_W = 600;
const SVG_H = 200;
const H_LINES = 17;
const V_LINES = 30;

const PATIENT_ID = "CG-AI-10234";

/* ─────────────────────────────────────────────
   NORMALISE raw ECG → SVG Y coords
───────────────────────────────────────────── */
function normaliseBuffer(buf: number[]): number[] {
  if (buf.length === 0) return [];
  const min = Math.min(...buf);
  const max = Math.max(...buf);
  const range = max - min || 1;
  const margin = SVG_H * 0.08;
  const usable = SVG_H - margin * 2;
  return buf.map((v) => margin + usable - ((v - min) / range) * usable);
}

function buildPath(yVals: number[]): string {
  if (yVals.length < 2) return "";
  const step = SVG_W / (yVals.length - 1);
  return yVals
    .map((y, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

/* ─────────────────────────────────────────────
   STATIC GRID
───────────────────────────────────────────── */
const GridLines = React.memo(function GridLines() {
  return (
    <>
      {[...Array(H_LINES)].map((_, i) => {
        const y = ((i / (H_LINES - 1)) * SVG_H).toFixed(1);
        return (
          <Line
            key={`h${i}`}
            x1="0"
            y1={y}
            x2={SVG_W}
            y2={y}
            stroke="rgba(0,255,127,0.07)"
            strokeWidth="1"
          />
        );
      })}
      {[...Array(V_LINES)].map((_, i) => {
        const x = ((i / (V_LINES - 1)) * SVG_W).toFixed(1);
        return (
          <Line
            key={`v${i}`}
            x1={x}
            y1="0"
            x2={x}
            y2={SVG_H}
            stroke="rgba(0,255,127,0.04)"
            strokeWidth="1"
          />
        );
      })}
    </>
  );
});

/* ─────────────────────────────────────────────
   STATUS OVERLAY
───────────────────────────────────────────── */
function StatusOverlay({ visible, type }: { visible: boolean; type: "lead_off" | "disconnected" }) {
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const icon = type === "disconnected" ? "wifi-off" : "alert-circle";
  const color = type === "disconnected" ? "#EF4444" : "#F59E0B";
  const title = type === "disconnected" ? "Device not connected" : "Electrodes not attached";
  const sub =
    type === "disconnected"
      ? "Ensure the ESP32 bridge is running"
      : "Reattach the ECG strap — last trace shown";

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Feather name={icon} size={20} color={color} />
      <Text style={[styles.overlayTitle, { color }]}>{title}</Text>
      <Text style={styles.overlaySub}>{sub}</Text>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ECGSection() {
  const { ecg: realEcg, bpm, connected, leadOff } = useECGStream();

  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<ReturnType<typeof createECGRecorder> | null>(null);

  /* ── Dummy ECG waveform ── */
  const dummyECG = useMemo(() => {
    const len = 200;
    const arr: number[] = [];

    for (let i = 0; i < len; i++) {
      const t = i / 12;

      let val =
        Math.sin(t) * 0.6 +
        Math.sin(t * 2.2) * 0.25 +
        Math.sin(t * 4.5) * 0.08;

      if (i % 45 === 0) val += 2.2;
      if (i % 45 === 1) val += 1.1;

      val += (Math.random() - 0.5) * 0.05;

      arr.push(val);
    }

    return arr;
  }, []);

  const ecg = realEcg.length > 0 ? realEcg : dummyECG;

  /* Always render the path */
  const pathData = useMemo(() => {
    if (ecg.length === 0) return "";
    return buildPath(normaliseBuffer(ecg));
  }, [ecg]);

  const showOverlayDisconnected = !connected;
  const showOverlayLeadOff = connected && leadOff;

  const waveColor = connected && !leadOff ? "#00FF7F" : "rgba(0,255,127,0.3)";
  const glowAlpha = connected && !leadOff ? "0.22" : "0.06";
  const modeLabel = !connected ? "PAUSED" : leadOff ? "LEAD-OFF" : "LIVE";
  const modeColor = !connected ? "#9CA3AF" : leadOff ? "#F59E0B" : "#00FF7F";

  React.useEffect(() => {
    if (recorderRef.current && ecg.length > 0) {
      recorderRef.current.push(ecg[ecg.length - 1]);
    }
  }, [ecg]);

  const handleRecord = useCallback(async () => {
    if (recording) return;

    setRecording(true);
    Alert.alert("Recording", "Recording ECG for 10 seconds…");

    try {
      const recorder = createECGRecorder(10_000);
      recorderRef.current = recorder;
      const samples = await recorder.result;
      recorderRef.current = null;

      await generateAndShareECGReport({
        patientId: PATIENT_ID,
        patientName: "Patient",
        bpm: bpm > 0 ? bpm : 0,
        ecgSamples: samples.length > 0 ? samples : ecg,
        timestamp: new Date(),
      });
    } catch (err: any) {
      Alert.alert("Report Error", err?.message ?? "Failed to generate report.");
    } finally {
      setRecording(false);
      recorderRef.current = null;
    }
  }, [recording, bpm, ecg]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.liveDot, { backgroundColor: modeColor }]} />
          <Text style={styles.title}>ECG Monitor</Text>
        </View>
      </View>

      <View style={styles.waveformWrap}>
        <Svg
          width="100%"
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
        >
          <GridLines />
          {pathData.length > 0 && (
            <>
              <Path
                d={pathData}
                stroke={`rgba(0,255,127,${glowAlpha})`}
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={pathData}
                stroke={waveColor}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </Svg>

        <StatusOverlay visible={showOverlayDisconnected} type="disconnected" />
        <StatusOverlay visible={showOverlayLeadOff} type="lead_off" />
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[styles.liveBadge, { borderColor: modeColor + "50" }]}>
            <View style={[styles.livePulse, { backgroundColor: modeColor }]} />
            <Text style={[styles.liveText, { color: modeColor }]}>{modeLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusItem}>
          <Text style={styles.metaLabel}>BPM</Text>
          <Text style={[styles.metaValue, bpm > 0 && connected && { color: "#00FF7F" }]}>
            {bpm > 0 ? String(bpm) : "—"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusItem}>
          <Text style={styles.metaLabel}>GAIN</Text>
          <Text style={styles.metaValue}>1.0×</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusItem}>
          <Text style={styles.metaLabel}>SPEED</Text>
          <Text style={styles.metaValue}>25 mm/s</Text>
        </View>
      </View>

      <View style={styles.recordRow}>
        <TouchableOpacity
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
          onPress={handleRecord}
          activeOpacity={0.82}
          disabled={recording}
        >
          {recording ? (
            <>
              <ActivityIndicator size="small" color="#00FF7F" />
              <Text style={styles.recordBtnText}>Recording… (10s)</Text>
            </>
          ) : (
            <>
              <Feather name="file-text" size={14} color="#00FF7F" />
              <Text style={styles.recordBtnText}>Record ECG Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#080D13",
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,255,127,0.12)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 12,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#00FF7F",
    letterSpacing: 0.3,
  },
  waveformWrap: {
    position: "relative",
    backgroundColor: "#080D13",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,13,19,0.72)",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  overlayTitle: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  overlaySub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    textAlign: "center",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,255,127,0.1)",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0,255,127,0.15)",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,255,127,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(0,255,127,0.45)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(0,255,127,0.75)",
  },
  recordRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,255,127,0.08)",
  },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,255,127,0.08)",
    paddingVertical: 11,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(0,255,127,0.25)",
  },
  recordBtnActive: {
    backgroundColor: "rgba(0,255,127,0.14)",
  },
  recordBtnText: {
    color: "#00FF7F",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});