import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  BackHandler,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { typography } from "../../constants/typography";
import { Feather } from "@expo/vector-icons";
import { useState, useContext } from "react";
import API from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";

export default function CaretakerRegister() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [fullName,         setFullName]         = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [passwordVisible,  setPasswordVisible]  = useState(false);
  const [loading,          setLoading]          = useState(false);

  const handleRegister = async () => {
    // ── validation ──
    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }
    if (!password) {
      alert("Please enter a password.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/register", {
        email: email.trim(),
        password,
        role: "caretaker",
        fullName: fullName.trim(),
      });

      await login(res.data.token, res.data.role);

      router.replace("/(caretaker)/dashboard");
    } catch (error: any) {
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/hero-bg.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => BackHandler.exitApp()}
      >
        <Feather name="arrow-left" size={22} color="#111827" />
        <Text style={styles.backText}>Exit</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[typography.h1, styles.title]}>
            Caretaker Register
          </Text>

          <Text style={styles.subtitle}>
            Create your caretaker account
          </Text>

          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Feather name="user" size={18} color="#6B7280" style={styles.leftIcon} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color="#6B7280" style={styles.leftIcon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color="#6B7280" style={styles.leftIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.rightIcon}
            >
              <Feather
                name={passwordVisible ? "eye-off" : "eye"}
                size={18}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color="#6B7280" style={styles.leftIcon} />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/caretaker-login")}
            >
              <Text style={styles.switchLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },

  backText: {
    marginLeft: 6,
    fontFamily: "InterMedium",
    color: "#111827",
    fontSize: 15,
  },

  container: {
    paddingTop: 120,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },

  title: {
    textAlign: "center",
    marginBottom: 10,
    color: "#111827",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "InterMedium",
    color: "#6B7280",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    height: 55,
  },

  leftIcon: {
    marginLeft: 15,
    marginRight: 10,
  },

  rightIcon: {
    marginRight: 15,
  },

  input: {
    flex: 1,
    fontFamily: "InterRegular",
    fontSize: 15,
    color: "#111827",
  },

  button: {
    marginTop: 10,
    height: 55,
    borderRadius: 14,
    backgroundColor: "#2E6CF6",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 16,
  },

  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  switchText: {
    fontFamily: "InterRegular",
    color: "#6B7280",
  },

  switchLink: {
    fontFamily: "InterSemiBold",
    color: "#2E6CF6",
  },
});