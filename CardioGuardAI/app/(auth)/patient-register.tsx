import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { typography } from "../../constants/typography";
import { Feather } from "@expo/vector-icons";
import { useState, useContext } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import API from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";

export default function PatientRegister() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDob(selectedDate);
  };

  const handleRegister = async () => {
    try {
      if (
        !fullName ||
        !email ||
        !dob ||
        !gender ||
        !emergencyContact ||
        !password ||
        !confirmPassword
      ) {
        alert("Please fill all fields");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      setLoading(true);

      const res = await API.post("/auth/register", {
        email,
        password,
        role: "patient",
        fullName,
        dob,
        gender,
        emergencyContact,
      });

      await login(res.data.token, res.data.role);

      router.replace("/(patient)/home");

    } catch (error: any) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = dob
    ? dob.toLocaleDateString()
    : "Select Date of Birth";

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/hero-bg.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[typography.h1, styles.title]}>
              Patient Registration
            </Text>

            <Text style={styles.subtitle}>
              Create your health monitoring account
            </Text>

            {/* Full Name */}
            <Input icon="user" placeholder="Full Name" value={fullName} onChangeText={setFullName} />

            {/* Email */}
            <Input icon="mail" placeholder="Email" value={email} onChangeText={setEmail} />

            {/* DOB */}
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowPicker(true)}
            >
              <Feather name="calendar" size={18} color="#6B7280" style={styles.leftIcon} />
              <Text style={[styles.dateText, !dob && { color: "#9CA3AF" }]}>
                {formattedDate}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={dob || new Date(2000, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                display="default"
                onChange={onDateChange}
              />
            )}

            {/* Gender */}
            <View style={styles.segmentContainer}>
              {["Male", "Female", "Other"].map((item) => {
                const selected = gender === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.segmentButton,
                      selected && styles.segmentSelected,
                    ]}
                    onPress={() => setGender(item)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Emergency Contact */}
            <Input
              icon="phone"
              placeholder="Emergency Contact Number"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
            />

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
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Feather
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Input
              icon="lock"
              placeholder="Confirm Password"
              secure
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

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

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.switchLink}>Login here</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function Input({ icon, placeholder, secure = false, value, onChangeText }: any) {
  return (
    <View style={styles.inputWrapper}>
      <Feather name={icon} size={18} color="#6B7280" style={styles.leftIcon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        secureTextEntry={secure}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  container: {
    padding: 30,
    paddingTop: 60,
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
    paddingHorizontal: 15,
  },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: "InterRegular",
    fontSize: 15,
    color: "#111827",
  },
  dateText: {
    fontFamily: "InterRegular",
    fontSize: 15,
    color: "#111827",
  },
  segmentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginHorizontal: 4,
  },
  segmentSelected: {
    backgroundColor: "#2E6CF6",
    borderColor: "#2E6CF6",
  },
  segmentText: {
    fontFamily: "InterMedium",
    color: "#374151",
  },
  segmentTextSelected: {
    color: "#FFFFFF",
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
