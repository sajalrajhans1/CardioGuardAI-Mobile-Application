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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { typography } from "../../constants/typography";
import { Feather } from "@expo/vector-icons";
import { useState, useContext } from "react";
import API from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";

export default function PatientLogin() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        alert("Please enter email and password");
        return;
      }

      setLoading(true);

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      await login(res.data.token, res.data.role);

      if (res.data.role === "patient") {
        router.replace("/(patient)/home");
      } else {
        router.replace("/(caretaker)/dashboard");
      }

    } catch (error: any) {
      alert(error.response?.data?.message || "Login failed");
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
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={[typography.h1, styles.title]}>
            Patient Login
          </Text>

          <Text style={styles.subtitle}>
            Access your health monitoring dashboard
          </Text>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Feather
              name="mail"
              size={18}
              color="#6B7280"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Enter your email"
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
            <Feather
              name="lock"
              size={18}
              color="#6B7280"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Enter your password"
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

          {/* Login Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              Don’t have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/patient-register")}
            >
              <Text style={styles.switchLink}>Register here</Text>
            </TouchableOpacity>
          </View>

          {/* Role Switch */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              Are you a caretaker?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/caretaker-login")}
            >
              <Text style={styles.switchLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  card: {
    paddingVertical: 40,
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

  leftIcon: { marginLeft: 15, marginRight: 10 },
  rightIcon: { marginRight: 15 },

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
    marginTop: 15,
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
