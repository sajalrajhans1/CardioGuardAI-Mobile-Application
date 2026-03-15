import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCaretakerWs } from "../../../caretaker/CaretakerWsContext";
import { GradientHeader }  from "../../../caretaker/components/GradientHeader";
import { BpmRing }         from "../../../caretaker/components/BpmRing";
import { StatusBadge }     from "../../../caretaker/components/StatusBadge";
import { PulseDot }        from "../../../caretaker/components/PulseDot";
import { Colors, Shadow, Radius, STATUS_CONFIG, formatTime } from "../../../caretaker/theme";

export default function Dashboard() {
  const { vitals, reconnect } = useCaretakerWs();

  const [patientName, setPatientName] = useState("—");
  const [patientId,   setPatientId]   = useState("—");
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  const runEntry = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
    ]).start();
  }, []);

  const loadPatient = useCallback(async () => {
    const id   = await AsyncStorage.getItem("linkedPatientId");
    const name = await AsyncStorage.getItem("linkedPatientName");
    if (!id) {
      router.replace("/(caretaker)/connect-patient");
      return;
    }
    setPatientId(id);
    setPatientName(name ?? "Patient");
    setLoading(false);
    runEntry();
  }, []);

  useEffect(() => { loadPatient(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPatient();
    reconnect();
    setRefreshing(false);
  }, []);

  const cfg        = STATUS_CONFIG[vitals.status];
  const unreadCount = vitals.alerts.filter((a) => !a.read).length;

  return (
    <View style={styles.root}>
      <GradientHeader
        title="Caretaker Dashboard"
        subtitle="Monitor your patient's heart health"
        rightSlot={
          <View style={styles.wsChip}>
            <PulseDot color={vitals.wsConnected ? "#86EFAC" : "#FCA5A5"} active={vitals.wsConnected} size={8} />
            <Text style={styles.wsLabel}>{vitals.wsConnected ? "Live" : "Offline"}</Text>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue600} />}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.blue600} />
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Alert banner ── */}
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.alertBanner, { borderColor: cfg.color }]}
                activeOpacity={0.85}
                onPress={() => router.push("/(caretaker)/(tabs)/alerts")}
              >
                <Feather name="alert-triangle" size={16} color={cfg.color} />
                <Text style={[styles.alertBannerText, { color: cfg.color }]}>
                  {unreadCount} unread alert{unreadCount > 1 ? "s" : ""} — tap to view
                </Text>
                <Feather name="chevron-right" size={14} color={cfg.color} />
              </TouchableOpacity>
            )}

            {/* ── Main patient card ── */}
            <View style={styles.card}>
              <View style={[styles.cardStrip, { backgroundColor: cfg.color }]} />
              <View style={styles.cardBody}>

                {/* Patient identity row */}
                <View style={styles.identityRow}>
                  <View style={[styles.avatar, { borderColor: cfg.color }]}>
                    <Feather name="user" size={26} color={Colors.blue600} />
                  </View>
                  <View style={styles.identityMeta}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <Text style={styles.patientId}>{patientId}</Text>
                    <StatusBadge status={vitals.status} size="sm" />
                  </View>
                </View>

                <View style={styles.divider} />

                {/* BPM ring */}
                <View style={styles.bpmSection}>
                  <BpmRing bpm={vitals.bpm} status={vitals.status} size={148} />
                  <Text style={styles.bpmLabel}>Heart Rate</Text>
                </View>

                <View style={styles.divider} />

                {/* Device + time row */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <View style={styles.metaIconBox}>
                      <PulseDot
                        color={vitals.deviceConnected ? Colors.normal : Colors.gray300}
                        active={vitals.deviceConnected}
                        size={8}
                      />
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>Device</Text>
                      <Text style={[styles.metaValue, { color: vitals.deviceConnected ? Colors.normal : Colors.gray400 }]}>
                        {vitals.deviceConnected ? "Connected" : "Disconnected"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metaSep} />
                  <View style={styles.metaItem}>
                    <View style={styles.metaIconBox}>
                      <Feather name="clock" size={14} color={Colors.gray400} />
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>Last Update</Text>
                      <Text style={styles.metaValue}>{formatTime(vitals.lastUpdated)}</Text>
                    </View>
                  </View>
                </View>

                {/* CTA */}
                <TouchableOpacity
                  style={styles.detailBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(caretaker)/(tabs)/patient-details")}
                >
                  <LinearGradient
                    colors={[Colors.blue600, Colors.blue800]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.detailBtnGrad}
                  >
                    <Text style={styles.detailBtnText}>View Full Patient Details</Text>
                    <Feather name="arrow-right" size={16} color={Colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Quick stats ── */}
            <View style={styles.statsRow}>
              {[
                { label: "Status",  value: cfg.label,                            color: cfg.color },
                { label: "BPM",     value: vitals.bpm > 0 ? `${vitals.bpm}` : "—", color: Colors.blue600 },
                { label: "Alerts",  value: `${vitals.alerts.length}`,            color: unreadCount > 0 ? Colors.critical : Colors.gray500 },
              ].map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* ── Diet shortcut ── */}
            <TouchableOpacity
              style={styles.dietCard}
              activeOpacity={0.85}
              onPress={() => router.push("/(caretaker)/(tabs)/what-to-feed")}
            >
              <View style={styles.dietIcon}>
                <Feather name="coffee" size={20} color={Colors.blue600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dietTitle}>What to Feed Today?</Text>
                <Text style={styles.dietSub}>Heart-healthy meal guidance based on current status</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.gray400} />
            </TouchableOpacity>

          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.gray100 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  center: { alignItems: "center", paddingTop: 60 },

  wsChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  wsLabel: { fontSize: 12, fontWeight: "600", color: Colors.white },

  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1.5, padding: 12, marginBottom: 12,
    ...Shadow.soft,
  },
  alertBannerText: { flex: 1, fontSize: 13, fontWeight: "600" },

  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    overflow: "hidden", marginBottom: 14, ...Shadow.card,
  },
  cardStrip: { height: 5 },
  cardBody:  { padding: 20, gap: 18 },

  identityRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.blue50, borderWidth: 2.5,
    alignItems: "center", justifyContent: "center",
  },
  identityMeta: { flex: 1, gap: 4 },
  patientName:  { fontSize: 18, fontWeight: "800", color: Colors.gray900, letterSpacing: -0.3 },
  patientId:    { fontSize: 12, color: Colors.gray400, fontWeight: "500", letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: Colors.gray100 },

  bpmSection: { alignItems: "center", gap: 6, paddingVertical: 4 },
  bpmLabel:   { fontSize: 11, fontWeight: "600", color: Colors.gray400, letterSpacing: 1.4, textTransform: "uppercase" },

  metaRow:    { flexDirection: "row", alignItems: "center" },
  metaItem:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  metaIconBox:{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center" },
  metaSep:    { width: 1, height: 36, backgroundColor: Colors.gray200, marginHorizontal: 16 },
  metaLabel:  { fontSize: 10, color: Colors.gray400, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue:  { fontSize: 13, fontWeight: "700", color: Colors.gray700, marginTop: 1 },

  detailBtn:     { borderRadius: Radius.md, overflow: "hidden", marginTop: 2 },
  detailBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  detailBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    paddingVertical: 14, paddingHorizontal: 12, alignItems: "center",
    ...Shadow.soft,
  },
  statValue: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontWeight: "600", color: Colors.gray400, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 3 },

  dietCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 16, ...Shadow.soft,
  },
  dietIcon:  { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blue50, alignItems: "center", justifyContent: "center" },
  dietTitle: { fontSize: 14, fontWeight: "700", color: Colors.gray900 },
  dietSub:   { fontSize: 12, color: Colors.gray500, marginTop: 2, lineHeight: 16 },
});