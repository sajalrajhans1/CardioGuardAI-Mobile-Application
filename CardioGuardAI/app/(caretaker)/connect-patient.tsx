import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  SafeAreaView, KeyboardAvoidingView, Platform, Animated,
} from "react-native";
import { LinearGradient }  from "expo-linear-gradient";
import { router }          from "expo-router";
import AsyncStorage        from "@react-native-async-storage/async-storage";
import { Feather }         from "@expo/vector-icons";
import API                 from "../../lib/api";
import { Colors, Shadow, Radius } from "../../caretaker/theme";

export default function ConnectPatient() {
  const [patientId, setPatientId] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [focused,   setFocused]   = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 11 }),
    ]).start();
  }, []);

  const shake = () =>
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 55, useNativeDriver: true }),
    ]).start();

  const handleConnect = async () => {
    const trimmed = patientId.trim().toUpperCase();
    if (!trimmed) {
      shake();
      Alert.alert("Required", "Please enter a Patient ID.");
      return;
    }

    setLoading(true);
    try {
      // Send { patientId } — matches req.body.patientId in linkCaretaker controller
      const res = await API.post("/patients/link", { patientId: trimmed });

      await AsyncStorage.setItem("linkedPatientId",   res.data.patientId);
      await AsyncStorage.setItem("linkedPatientName", res.data.fullName ?? "");

      router.replace("/(caretaker)/(tabs)/dashboard");
    } catch (err: any) {
      shake();
      Alert.alert(
        "Patient Not Found",
        err?.response?.data?.message ?? "Invalid Patient ID. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#EFF6FF", "#DBEAFE", "#F0F9FF"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Feather name="activity" size={18} color={Colors.white} />
          </View>
          <Text style={styles.brandName}>CardioGuard AI</Text>
        </View>

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity:   fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.blue600, Colors.blue800]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.cardAccent}
          />
          <View style={styles.cardBody}>
            <View style={styles.iconCircle}>
              <Feather name="link" size={24} color={Colors.blue600} />
            </View>
            <Text style={styles.title}>Connect Your Patient</Text>
            <Text style={styles.subtitle}>
              Enter the Patient ID provided during patient registration.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.label}>Patient ID</Text>
            <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
              <Text style={styles.inputPrefix}>ID</Text>
              <View style={styles.inputSep} />
              <TextInput
                style={styles.input}
                placeholder="e.g. PAT1771504055659"
                placeholderTextColor={Colors.gray400}
                value={patientId}
                onChangeText={setPatientId}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleConnect}
                editable={!loading}
              />
            </View>
            <Text style={styles.hint}>Starts with "PAT" followed by digits.</Text>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.75 }]}
              activeOpacity={0.85}
              onPress={handleConnect}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [Colors.blue400, Colors.blue400] : [Colors.blue600, Colors.blue800]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btnGrad}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <>
                      <Text style={styles.btnText}>Connect Patient</Text>
                      <Feather name="arrow-right" size={16} color={Colors.white} />
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={styles.footer}>
          The Patient ID is generated automatically when a patient registers.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav:  { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },

  brand:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  brandIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.blue600, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 16, fontWeight: "700", color: Colors.blue800 },

  card: {
    width: "100%", maxWidth: 420, backgroundColor: Colors.white,
    borderRadius: Radius.xxl, overflow: "hidden", ...Shadow.strong,
  },
  cardAccent: { height: 5 },
  cardBody:   { padding: 28, gap: 12 },

  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.blue50,
    alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 4,
  },
  title:    { fontSize: 22, fontWeight: "800", color: Colors.gray900, textAlign: "center", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: Colors.gray500, textAlign: "center", lineHeight: 20 },
  divider:  { height: 1, backgroundColor: Colors.gray100, marginVertical: 4 },
  label:    { fontSize: 13, fontWeight: "600", color: Colors.gray700 },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: Colors.gray200,
    borderRadius: Radius.lg, backgroundColor: Colors.gray50, overflow: "hidden",
  },
  inputRowFocused: {
    borderColor: Colors.blue600, backgroundColor: Colors.white,
    shadowColor: Colors.blue600, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  inputPrefix: { paddingHorizontal: 14, fontSize: 12, fontWeight: "700", color: Colors.blue600, letterSpacing: 0.5 },
  inputSep:    { width: 1, height: 22, backgroundColor: Colors.gray200 },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 14,
    fontSize: 15, fontWeight: "600", color: Colors.gray900, letterSpacing: 0.8,
  },
  hint: { fontSize: 11, color: Colors.gray400 },

  btn:     { borderRadius: Radius.md, overflow: "hidden", marginTop: 4 },
  btnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15, gap: 8, minHeight: 52 },
  btnText: { fontSize: 16, fontWeight: "700", color: Colors.white },

  footer: { marginTop: 24, fontSize: 12, color: Colors.gray400, textAlign: "center", lineHeight: 18 },
});