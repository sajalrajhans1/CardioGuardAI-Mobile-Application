import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useNavigation } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ProfileContext } from "../../../context/ProfileContext";
import { updateProfile } from "../../../lib/profileService";

const GENDERS  = ["Male", "Female", "Other"];
const MED_LIST = ["Aspirin", "Metoprolol", "Atorvastatin", "Clopidogrel"];

const ACCENT = {
  personal:  "#4F6EF7",
  medical:   "#E879A0",
  emergency: "#EF4444",
};

// ─────────────────────────────────────────────
export default function EditProfileScreen() {
  const { profile, refreshProfile } = useContext(ProfileContext);
  const router     = useRouter();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [form,    setForm]    = useState<any>(null);
  const [initial, setInitial] = useState<any>(null);
  const [saving,  setSaving]  = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showMeds, setShowMeds] = useState(false);

  // card fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (profile) { setForm(profile); setInitial(profile); }
  }, [profile]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (!dirty) return;
      e.preventDefault();
      Alert.alert("Unsaved Changes", "Discard changes and go back?", [
        { text: "Stay", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, dirty]);

  if (!form) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4F6EF7" />
      </View>
    );
  }

  // deep-set helper
  const set = (path: string[], val: any) => {
    setForm((prev: any) => {
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        cur[path[i]] = { ...cur[path[i]] };
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = val;
      return next;
    });
  };

  const handleSave = () => {
    Alert.alert(
      "Save Changes",
      "Do you want to save the changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setSaving(true);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await updateProfile(form);
              await refreshProfile();
              router.back();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const fmtDOB = (dob?: string) => {
    if (!dob) return "Select date of birth";
    return new Date(dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const toggleMed = (m: string) => {
    const list: string[] = form.medicalBackground.medications ?? [];
    set(["medicalBackground", "medications"],
      list.includes(m) ? list.filter((x: string) => x !== m) : [...list, m]);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>

      {/* ── header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={19} color="#0F172A" />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={[s.saveBtn, (!dirty || saving) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!dirty || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveTxt}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      {/* dirty banner */}
      {dirty && (
        <View style={s.dirtyBanner}>
          <Feather name="alert-circle" size={12} color="#4F6EF7" />
          <Text style={s.dirtyTxt}>You have unsaved changes</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ── Personal Information ── */}
            <FormCard title="Personal Information" iconName="user" accent={ACCENT.personal}>

              <FieldLabel label="Full Name" />
              <TextInput
                style={s.input}
                value={form.personalInfo.fullName}
                onChangeText={(t) => set(["personalInfo", "fullName"], t)}
                placeholder="Enter full name"
                placeholderTextColor="#CBD5E1"
              />

              <FieldLabel label="Gender" />
              <View style={s.segRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[s.seg, form.personalInfo.gender === g && [s.segActive, { backgroundColor: ACCENT.personal, borderColor: ACCENT.personal }]]}
                    onPress={() => set(["personalInfo", "gender"], g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.segTxt, form.personalInfo.gender === g && s.segTxtActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FieldLabel label="Date of Birth" />
              <TouchableOpacity
                style={s.selector}
                onPress={() => setShowDate(true)}
                activeOpacity={0.8}
              >
                <Feather name="calendar" size={15} color="#94A3B8" />
                <Text style={[s.selectorTxt, !form.personalInfo.dob && { color: "#CBD5E1" }]}>
                  {fmtDOB(form.personalInfo.dob)}
                </Text>
              </TouchableOpacity>

              {showDate && (
                <DateTimePicker
                  value={form.personalInfo.dob ? new Date(form.personalInfo.dob) : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => {
                    setShowDate(Platform.OS === "ios");
                    if (d) set(["personalInfo", "dob"], d.toISOString());
                  }}
                />
              )}

              <View style={s.twoCol}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <FieldLabel label="Height (cm)" />
                  <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    value={String(form.physicalMetrics.height || "")}
                    onChangeText={(t) => set(["physicalMetrics", "height"], t)}
                    placeholder="cm"
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Weight (kg)" />
                  <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    value={String(form.physicalMetrics.weight || "")}
                    onChangeText={(t) => set(["physicalMetrics", "weight"], t)}
                    placeholder="kg"
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
              </View>

            </FormCard>

            {/* ── Medical Background ── */}
            <FormCard title="Medical Background" iconName="heart" accent={ACCENT.medical}>

              <ToggleRow
                label="Panic Attacks"
                sub="History of panic episodes"
                value={form.medicalBackground.panicHistory}
                onChange={(v) => set(["medicalBackground", "panicHistory"], v)}
                accent={ACCENT.medical}
              />

              <View style={s.fieldDivider} />

              <ToggleRow
                label="On Medication"
                sub="Currently taking medication"
                value={form.medicalBackground.onMedication}
                onChange={(v) => set(["medicalBackground", "onMedication"], v)}
                accent={ACCENT.medical}
              />

              {form.medicalBackground.onMedication && (
                <>
                  <View style={s.fieldDivider} />
                  <FieldLabel label="Medications" />
                  <TouchableOpacity
                    style={s.selector}
                    onPress={() => setShowMeds(true)}
                    activeOpacity={0.8}
                  >
                    <Feather name="package" size={15} color="#94A3B8" />
                    <Text style={[s.selectorTxt, !(form.medicalBackground.medications?.length) && { color: "#CBD5E1" }]}>
                      {form.medicalBackground.medications?.length
                        ? form.medicalBackground.medications.join(", ")
                        : "Select medications"}
                    </Text>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" style={{ marginLeft: "auto" }} />
                  </TouchableOpacity>
                </>
              )}

            </FormCard>

            {/* ── Emergency Contact ── */}
            <FormCard title="Emergency Contact" iconName="phone-call" accent={ACCENT.emergency}>

              <FieldLabel label="Contact Name" />
              <TextInput
                style={s.input}
                value={form.emergencyContact.name}
                onChangeText={(t) => set(["emergencyContact", "name"], t)}
                placeholder="Full name"
                placeholderTextColor="#CBD5E1"
              />

              <FieldLabel label="Phone Number" />
              <TextInput
                style={[s.input, { marginBottom: 0 }]}
                keyboardType="phone-pad"
                value={form.emergencyContact.phone}
                onChangeText={(t) => set(["emergencyContact", "phone"], t)}
                placeholder="+91 98765 43210"
                placeholderTextColor="#CBD5E1"
              />

            </FormCard>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Medication bottom sheet ── */}
      <Modal visible={showMeds} transparent animationType="slide">
        <Pressable style={s.sheetBackdrop} onPress={() => setShowMeds(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Select Medications</Text>
            <Text style={s.sheetSub}>Tap to toggle</Text>

            {MED_LIST.map((m) => {
              const sel = (form.medicalBackground.medications ?? []).includes(m);
              return (
                <Pressable
                  key={m}
                  style={[s.medRow, sel && s.medRowActive]}
                  onPress={() => toggleMed(m)}
                >
                  <Text style={[s.medTxt, sel && { color: "#4F6EF7", fontWeight: "700" }]}>{m}</Text>
                  <View style={[s.checkCircle, sel && s.checkCircleOn]}>
                    {sel && <Feather name="check" size={11} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}

            <TouchableOpacity
              style={s.sheetDoneWrap}
              onPress={() => setShowMeds(false)}
            >
              <LinearGradient
                colors={["#4F6EF7", "#2D4FCC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.sheetDoneGrad}
              >
                <Text style={s.sheetDoneTxt}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function FormCard({
  title,
  iconName,
  accent,
  children,
}: {
  title: string;
  iconName: React.ComponentProps<typeof Feather>["name"];
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      <View style={[s.cardStripe, { backgroundColor: accent }]} />
      <View style={s.cardInner}>
        <View style={s.cardHead}>
          <View style={[s.cardIconBox, { backgroundColor: accent + "18" }]}>
            <Feather name={iconName} size={15} color={accent} />
          </View>
          <Text style={s.cardTitle}>{title}</Text>
        </View>
        <View style={s.cardDivider} />
        {children}
      </View>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={s.fieldLabel}>{label}</Text>;
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
  accent,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        <Text style={s.toggleSub}>{sub}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onChange(!value)}
        activeOpacity={0.85}
        style={[s.toggle, { backgroundColor: value ? accent : "#E2E8F0" }]}
      >
        <Animated.View style={[s.toggleThumb, { transform: [{ translateX: value ? 20 : 2 }] }]} />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#EDF1FB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    shadowColor: "#3B5FDB",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  saveBtn: {
    backgroundColor: "#4F6EF7",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 22,
    minWidth: 68,
    alignItems: "center",
    shadowColor: "#4F6EF7",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  saveTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },

  /* dirty banner */
  dirtyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E7FF",
  },
  dirtyTxt: { fontSize: 12, fontWeight: "600", color: "#4F6EF7" },

  /* scroll */
  body: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  /* card */
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 22,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#3B5FDB",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardStripe: { width: 4 },
  cardInner: { flex: 1, padding: 20 },
  cardHead: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  cardDivider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 18 },

  /* field */
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    backgroundColor: "#FAFBFF",
    marginBottom: 16,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#FAFBFF",
    marginBottom: 16,
  },
  selectorTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
  },

  /* gender segmented */
  segRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  seg: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    backgroundColor: "#FAFBFF",
  },
  segActive: {},
  segTxt:       { fontSize: 13, fontWeight: "600", color: "#94A3B8" },
  segTxtActive: { color: "#fff", fontWeight: "800" },

  /* two column */
  twoCol: { flexDirection: "row" },

  /* field divider */
  fieldDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 },

  /* toggle */
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  toggleSub:   { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },

  /* bottom sheet */
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  sheetSub:   { fontSize: 13, color: "#94A3B8", marginBottom: 20 },
  medRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: "#F8FAFC",
  },
  medRowActive: { backgroundColor: "#EEF2FF" },
  medTxt: { fontSize: 14, color: "#1E293B" },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkCircleOn: { backgroundColor: "#4F6EF7", borderColor: "#4F6EF7" },
  sheetDoneWrap: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#4F6EF7",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sheetDoneGrad: { paddingVertical: 16, alignItems: "center" },
  sheetDoneTxt:  { color: "#fff", fontSize: 15, fontWeight: "800" },
});