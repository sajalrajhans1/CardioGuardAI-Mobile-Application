import React, { useContext, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ProfileContext } from "../../../context/ProfileContext";
import { AuthContext } from "../../../context/AuthContext";
import { updateProfile } from "../../../lib/profileService";
import api from "../../../lib/api";

const { width } = Dimensions.get("window");

const TAGLINES = [
  "Every beat matters. Keep going.",
  "Stay consistent. Your heart will thank you.",
  "Strong heart. Strong life.",
  "Your health is your real wealth.",
  "Small steps lead to a stronger heart.",
];

// ─────────────────────────────────────────────
export default function ProfileScreen() {
  const { profile, loading, refreshProfile } = useContext(ProfileContext);
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  const [tagline] = useState(TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

  // fade-in animation for cards
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const changePhoto = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled) return;
      const fd = new FormData();
      fd.append("image", {
        uri: result.assets[0].uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);
      const res = await api.post("/patient/upload-photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await updateProfile({ ...profile, profilePhoto: res.data.imageUrl });
      await refreshProfile();
    } catch {
      Alert.alert("Upload failed", "Could not upload image.");
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4F6EF7" />
      </View>
    );
  }

  // ── derived values ──
  const firstName  = profile?.personalInfo?.fullName?.split(" ")[0] || "Patient";
  const fullName   = profile?.personalInfo?.fullName || "—";
  const dob        = profile?.personalInfo?.dob;
  const ageVal     = calcAge(dob);
  const hNum       = Number(profile?.physicalMetrics?.height);
  const wNum       = Number(profile?.physicalMetrics?.weight);
  const bmiNum     = hNum && wNum ? wNum / ((hNum / 100) ** 2) : null;
  const bmiStr     = bmiNum ? bmiNum.toFixed(1) : "—";
  const bmiLabel   = bmiNum ? bmiCat(bmiNum) : "";
  const bmiCol     = bmiNum ? bmiColor(bmiNum) : "#94A3B8";
  const connected  = profile?.deviceInfo?.strapStatus === "Connected";
  const meds: string[] = profile?.medicalBackground?.medications ?? [];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ══════════════════════════════
           HERO HEADER
      ══════════════════════════════ */}
      <View style={s.heroShadowWrap}>
        <View style={s.hero}>
          {/* gradient */}
          <LinearGradient
            colors={["#0B1340", "#1B2E8A", "#3355CC"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* soft radial overlay for depth */}
          <View style={s.radialOverlay} />

          {/* decorative rings */}
          <View style={s.dRing1} />
          <View style={s.dRing2} />

          {/* ── logout top-right ── */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Feather name="log-out" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={s.logoutTxt}>Log out</Text>
          </TouchableOpacity>

          {/* ── avatar ── */}
          <View style={s.avatarWrap}>
            {/* outer glow */}
            <View style={s.avatarGlow} />
            <View style={s.avatarBorder}>
              <Image
                source={
                  profile?.profilePhoto
                    ? { uri: profile.profilePhoto }
                    : require("../../../assets/profile/default-avatar.png")
                }
                style={s.avatarImg}
              />
            </View>
            {/* camera */}
            <TouchableOpacity style={s.camBtn} onPress={changePhoto} activeOpacity={0.85}>
              <Feather name="camera" size={13} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── name + tagline ── */}
          <Text style={s.heroName}>{firstName}</Text>
          <Text style={s.heroTag}>{tagline}</Text>

          {/* ── stat pills ── */}
          <View style={s.pillsRow}>
            <GlassPill
              icon={<Feather name="activity" size={12} color="#93C5FD" />}
              label={ageVal !== "—" ? `${ageVal} yrs` : "— yrs"}
            />
            <GlassPill
              icon={<MaterialCommunityIcons name="scale-bathroom" size={13} color="#93C5FD" />}
              label={bmiStr !== "—" ? `BMI ${bmiStr}` : "BMI —"}
            />
            <GlassPill
              icon={
                <Feather
                  name={connected ? "bluetooth" : "bluetooth-off"}
                  size={12}
                  color={connected ? "#6EE7B7" : "#FCA5A5"}
                />
              }
              label={connected ? "Connected" : "No Strap"}
              labelColor={connected ? "#6EE7B7" : "#FCA5A5"}
            />
          </View>
        </View>
      </View>

      {/* ══════════════════════════════
           SCROLLABLE CARDS
      ══════════════════════════════ */}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Personal Information */}
          <SectionCard title="Personal Information" iconName="user" iconBg="#EEF2FF" iconColor="#4F6EF7" accentColor="#4F6EF7">
            <InfoRow label="Full Name"      value={fullName} />
            <InfoRow label="Gender"         value={profile?.personalInfo?.gender} />
            <InfoRow label="Date of Birth"  value={fmtDOB(dob)} />
            <InfoRow label="Age"            value={ageVal !== "—" ? `${ageVal} years` : "—"} />
            <InfoRow label="Height"         value={hNum ? `${hNum} cm` : "—"} />
            <InfoRow label="Weight"         value={wNum ? `${wNum} kg` : "—"} />
            <InfoRow
              label="BMI"
              value={bmiStr !== "—" ? `${bmiStr} · ${bmiLabel}` : "—"}
              valueColor={bmiCol}
              last
            />
          </SectionCard>

          {/* Medical Background */}
          <SectionCard title="Medical Background" iconName="heart" iconBg="#FFF0F6" iconColor="#E879A0" accentColor="#E879A0">
            <InfoRow
              label="Panic Attacks"
              value={profile?.medicalBackground?.panicHistory ? "Yes" : "No"}
              badge
              badgeBg={profile?.medicalBackground?.panicHistory ? "#FEE2E2" : "#DCFCE7"}
              badgeColor={profile?.medicalBackground?.panicHistory ? "#DC2626" : "#16A34A"}
            />
            <InfoRow
              label="On Medication"
              value={profile?.medicalBackground?.onMedication ? "Yes" : "No"}
              badge
              badgeBg={profile?.medicalBackground?.onMedication ? "#EFF6FF" : "#DCFCE7"}
              badgeColor={profile?.medicalBackground?.onMedication ? "#2563EB" : "#16A34A"}
              last={meds.length === 0}
            />
            {meds.length > 0 && (
              <InfoRow label="Medications" value={meds.join(", ")} last />
            )}
          </SectionCard>

          {/* Emergency Contact */}
          <SectionCard title="Emergency Contact" iconName="phone-call" iconBg="#FFF5F5" iconColor="#EF4444" accentColor="#EF4444">
            <InfoRow label="Name"  value={profile?.emergencyContact?.name} />
            <InfoRow label="Phone" value={profile?.emergencyContact?.phone} valueColor="#3B5FDB" last />
          </SectionCard>

          {/* Device Information */}
          <SectionCard title="Device Information" iconName="cpu" iconBg="#F0FDF4" iconColor="#10B981" accentColor="#10B981">
            <View style={s.deviceRow}>
              <View style={[s.deviceIconBox, { backgroundColor: connected ? "#ECFDF5" : "#FEF2F2" }]}>
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={22}
                  color={connected ? "#10B981" : "#EF4444"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.deviceName}>ECG Strap</Text>
                <View style={s.deviceStatusRow}>
                  <View style={[s.statusDot, { backgroundColor: connected ? "#10B981" : "#EF4444" }]} />
                  <Text style={[s.deviceStatusTxt, { color: connected ? "#10B981" : "#EF4444" }]}>
                    {connected ? "CONNECTED" : "DISCONNECTED"}
                  </Text>
                </View>
              </View>
              <View style={[s.livePill, { backgroundColor: connected ? "#ECFDF5" : "#FEF2F2" }]}>
                <Text style={[s.livePillTxt, { color: connected ? "#10B981" : "#EF4444" }]}>
                  {connected ? "Live" : "Offline"}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Edit Profile Button */}
          <EditButton onPress={() => router.push("/profile/edit")} />

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function GlassPill({
  icon,
  label,
  labelColor,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
}) {
  return (
    <View style={s.glassPill}>
      {icon}
      <Text style={[s.glassPillTxt, labelColor ? { color: labelColor } : {}]}>
        {label}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  iconName,
  iconBg,
  iconColor,
  accentColor,
  children,
}: {
  title: string;
  iconName: React.ComponentProps<typeof Feather>["name"];
  iconBg: string;
  iconColor: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      {/* left accent stripe */}
      <View style={[s.cardStripe, { backgroundColor: accentColor }]} />
      <View style={s.cardContent}>
        {/* header */}
        <View style={s.cardHeaderRow}>
          <View style={[s.cardIconBox, { backgroundColor: iconBg }]}>
            <Feather name={iconName} size={15} color={iconColor} />
          </View>
          <Text style={s.cardTitle}>{title}</Text>
        </View>
        <View style={s.cardDivider} />
        {children}
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last,
  valueColor,
  badge,
  badgeBg,
  badgeColor,
}: {
  label: string;
  value?: string | number;
  last?: boolean;
  valueColor?: string;
  badge?: boolean;
  badgeBg?: string;
  badgeColor?: string;
}) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <Text style={s.rowLabel}>{label}</Text>
      {badge ? (
        <View style={[s.badge, { backgroundColor: badgeBg }]}>
          <Text style={[s.badgeTxt, { color: badgeColor }]}>{value || "—"}</Text>
        </View>
      ) : (
        <Text style={[s.rowValue, valueColor ? { color: valueColor } : {}]}>
          {value || "—"}
        </Text>
      )}
    </View>
  );
}

function EditButton({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={[s.editWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity onPress={press} activeOpacity={1} style={s.editTouch}>
        <LinearGradient
          colors={["#4F6EF7", "#2D4FCC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.editGrad}
        >
          <Feather name="edit-3" size={16} color="#fff" style={{ marginRight: 10 }} />
          <Text style={s.editTxt}>Edit Profile</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function calcAge(dob?: string): string | number {
  if (!dob) return "—";
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}

function fmtDOB(dob?: string) {
  if (!dob) return "—";
  return new Date(dob).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function bmiCat(b: number) {
  if (b < 18.5) return "Underweight";
  if (b < 25)   return "Normal";
  if (b < 30)   return "Overweight";
  return "Obese";
}

function bmiColor(b: number) {
  if (b < 18.5) return "#F59E0B";
  if (b < 25)   return "#10B981";
  if (b < 30)   return "#F97316";
  return "#EF4444";
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const AVATAR_SIZE  = 100;
const HERO_H       = 310;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#EDF1FB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* ── hero shadow wrapper ── */
  heroShadowWrap: {
    shadowColor: "#1B2E8A",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },

  /* ── hero ── */
  hero: {
    height: HERO_H,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 52,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },

  radialOverlay: {
    position: "absolute",
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: "rgba(100,120,255,0.08)",
    top: -width * 0.6,
    alignSelf: "center",
  },

  dRing1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.12)",
    top: -100,
    left: -80,
  },
  dRing2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.08)",
    top: 20,
    right: -60,
  },

  /* logout */
  logoutBtn: {
    position: "absolute",
    top: 52,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 24,
  },
  logoutTxt: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* avatar */
  avatarWrap: {
    alignSelf: "center",
    marginBottom: 12,
  },
  avatarGlow: {
    position: "absolute",
    width: AVATAR_SIZE + 24,
    height: AVATAR_SIZE + 24,
    borderRadius: (AVATAR_SIZE + 24) / 2,
    borderWidth: 1.5,
    borderColor: "rgba(147,197,253,0.3)",
    top: -12,
    left: -12,
  },
  avatarBorder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#3355CC",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  avatarImg: { width: "100%", height: "100%" },
  camBtn: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4F6EF7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#4F6EF7",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },

  /* name & tagline */
  heroName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroTag: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "400",
    marginTop: 4,
    marginBottom: 18,
    letterSpacing: 0.1,
  },

  /* pills */
  pillsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  glassPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 30,
  },
  glassPillTxt: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* scroll */
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 130,
  },

  /* card */
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 22,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#3B5FDB",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardStripe: { width: 4 },
  cardContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 6,
  },

  /* rows */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.8)",
  },
  rowLabel: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    maxWidth: "55%",
    textAlign: "right",
  },

  /* badge */
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: "800",
  },

  /* device card */
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  deviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  deviceStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  deviceStatusTxt: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  livePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  livePillTxt: {
    fontSize: 12,
    fontWeight: "800",
  },

  /* edit button */
  editWrap: {
    marginTop: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#3B5FDB",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  editTouch: { borderRadius: 20, overflow: "hidden" },
  editGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
  },
  editTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});