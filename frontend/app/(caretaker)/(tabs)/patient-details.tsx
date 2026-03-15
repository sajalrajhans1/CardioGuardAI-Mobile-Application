import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useCaretakerWs }  from "../../../caretaker/CaretakerWsContext";
import { GradientHeader }  from "../../../caretaker/components/GradientHeader";
import { BpmRing }         from "../../../caretaker/components/BpmRing";
import { StatusBadge }     from "../../../caretaker/components/StatusBadge";
import { PulseDot }        from "../../../caretaker/components/PulseDot";
import { Colors, Shadow, Radius, formatTime } from "../../../caretaker/theme";
import API from "../../../lib/api";

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={detailStyles.infoRow}>
    <View style={detailStyles.infoIcon}>
      <Feather name={icon as any} size={14} color={Colors.blue600} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={detailStyles.infoLabel}>{label}</Text>
      <Text style={detailStyles.infoValue}>{value || "—"}</Text>
    </View>
  </View>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <View style={detailStyles.section}>
    <View style={detailStyles.sectionHeader}>
      <Feather name={icon as any} size={14} color={Colors.blue600} />
      <Text style={detailStyles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PatientDetails() {
  const { vitals } = useCaretakerWs();

  const [profile,    setProfile]    = useState<any>(null);
  const [patientId,  setPatientId]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      const id = await AsyncStorage.getItem("linkedPatientId");
      if (!id) return;
      setPatientId(id);

      const res = await API.post("/patients/verify", { patientId: id });
      setProfile(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load patient profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const p    = profile ?? {};
  const info = p.personalInfo ?? {};
  const med  = p.medicalBackground ?? {};
  const ec   = p.emergencyContact ?? {};
  const phys = p.physicalMetrics ?? {};

  return (
    <View style={detailStyles.root}>
      <GradientHeader
        title="Patient Details"
        subtitle="Health profile and live vitals"
      />

      <ScrollView
        style={detailStyles.scroll}
        contentContainerStyle={detailStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue600} />}
      >
        {loading ? (
          <View style={detailStyles.center}>
            <ActivityIndicator size="large" color={Colors.blue600} />
          </View>
        ) : error ? (
          <View style={detailStyles.center}>
            <Feather name="alert-circle" size={32} color={Colors.critical} />
            <Text style={detailStyles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* ── Live vitals card ── */}
            <View style={detailStyles.vitalsCard}>
              <View style={detailStyles.vitalsTop}>
                <View>
                  <Text style={detailStyles.vitalsName}>{p.fullName ?? info.fullName ?? "—"}</Text>
                  <Text style={detailStyles.vitalsId}>{patientId}</Text>
                </View>
                <StatusBadge status={vitals.status} size="md" />
              </View>

              <View style={detailStyles.vitalsDivider} />

              <View style={detailStyles.vitalsRow}>
                <BpmRing bpm={vitals.bpm} status={vitals.status} size={120} />
                <View style={detailStyles.vitalsRight}>
                  <View style={detailStyles.vitalsStat}>
                    <Text style={detailStyles.vitalsStatLabel}>Device</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <PulseDot
                        color={vitals.deviceConnected ? Colors.normal : Colors.gray300}
                        active={vitals.deviceConnected}
                        size={7}
                      />
                      <Text style={[detailStyles.vitalsStatValue, { color: vitals.deviceConnected ? Colors.normal : Colors.gray400 }]}>
                        {vitals.deviceConnected ? "Connected" : "Disconnected"}
                      </Text>
                    </View>
                  </View>
                  <View style={detailStyles.vitalsStat}>
                    <Text style={detailStyles.vitalsStatLabel}>Last Update</Text>
                    <Text style={detailStyles.vitalsStatValue}>{formatTime(vitals.lastUpdated)}</Text>
                  </View>
                  <View style={detailStyles.vitalsStat}>
                    <Text style={detailStyles.vitalsStatLabel}>ECG Points</Text>
                    <Text style={detailStyles.vitalsStatValue}>{vitals.ecgHistory.length}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Personal info ── */}
            <Section title="Personal Information" icon="user">
              <InfoRow icon="user"     label="Full Name"    value={p.fullName ?? info.fullName} />
              <InfoRow icon="calendar" label="Date of Birth" value={info.dob ? new Date(info.dob).toLocaleDateString() : ""} />
              <InfoRow icon="users"    label="Gender"       value={info.gender} />
            </Section>

            {/* ── Physical metrics ── */}
            <Section title="Physical Metrics" icon="activity">
              <InfoRow icon="arrow-up"   label="Height" value={phys.height ? `${phys.height} cm` : ""} />
              <InfoRow icon="chevrons-down" label="Weight" value={phys.weight ? `${phys.weight} kg` : ""} />
            </Section>

            {/* ── Medical background ── */}
            <Section title="Medical Background" icon="heart">
              <InfoRow icon="alert-circle" label="Panic History"  value={med.panicHistory ? "Yes" : "No"} />
              <InfoRow icon="package"      label="On Medication"  value={med.onMedication ? "Yes" : "No"} />
              {Array.isArray(med.medications) && med.medications.length > 0 && (
                <InfoRow icon="list" label="Medications" value={med.medications.join(", ")} />
              )}
            </Section>

            {/* ── Emergency contact ── */}
            <Section title="Emergency Contact" icon="phone">
              <InfoRow icon="user"   label="Name"     value={ec.name} />
              <InfoRow icon="phone"  label="Phone"    value={ec.phone} />
              <InfoRow icon="heart"  label="Relation" value={ec.relation} />
            </Section>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.gray100 },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  center:  { alignItems: "center", paddingTop: 60, gap: 12 },
  errorText: { fontSize: 14, color: Colors.critical, textAlign: "center" },

  // Vitals card
  vitalsCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: 18, marginBottom: 14, ...Shadow.card,
  },
  vitalsTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14,
  },
  vitalsName: { fontSize: 18, fontWeight: "800", color: Colors.gray900, letterSpacing: -0.3 },
  vitalsId:   { fontSize: 12, color: Colors.gray400, marginTop: 2, letterSpacing: 0.5 },
  vitalsDivider: { height: 1, backgroundColor: Colors.gray100, marginBottom: 14 },
  vitalsRow:  { flexDirection: "row", alignItems: "center", gap: 16 },
  vitalsRight: { flex: 1, gap: 14 },
  vitalsStat:  {},
  vitalsStatLabel: { fontSize: 10, color: Colors.gray400, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  vitalsStatValue: { fontSize: 13, fontWeight: "700", color: Colors.gray700, marginTop: 2 },

  // Sections
  section: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    overflow: "hidden", marginBottom: 12, ...Shadow.soft,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
    backgroundColor: Colors.blue50,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.blue800, letterSpacing: 0.2 },

  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  infoIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.blue50, alignItems: "center", justifyContent: "center",
  },
  infoLabel: { fontSize: 10, color: Colors.gray400, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 14, fontWeight: "600", color: Colors.gray800, marginTop: 1 },
});