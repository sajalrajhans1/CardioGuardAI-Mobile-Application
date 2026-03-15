import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { typography } from "../constants/typography";

export default function LandingPage() {
  const router = useRouter();

  const confirmNavigation = (role: "patient" | "caretaker") => {
    const isPatient = role === "patient";

    Alert.alert(
      "Confirm Role",
      `Are you sure you want to proceed as a ${
        isPatient ? "patient" : "caretaker"
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            router.replace(
              isPatient
                ? "/(auth)/login"
                : "/(auth)/caretaker-login"
            );
          },
        },
      ]
    );
  };

  return (
    <ImageBackground
      source={require("../assets/backgrounds/hero-bg.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.h1, styles.title]}>
          CardioGuard<Text style={styles.ai}>AI</Text>
        </Text>

        <Text style={styles.subtitle}>
          Continuous ECG • Intelligent Alerts • Lifestyle Insights
        </Text>
      </View>

      {/* EMPTY MIDDLE SPACE — intentionally kept */}
      <View style={styles.middleSpace} />

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => confirmNavigation("patient")}
        >
          <Text style={styles.primaryText}>
            Continue as Patient
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => confirmNavigation("caretaker")}
        >
          <Text style={styles.secondaryText}>
            Continue as Caretaker
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "space-between",
    paddingTop: 90,
    paddingBottom: 70,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
  },

  header: {
    alignItems: "center",
  },

  title: {
    fontSize: 40,
    color: "#111827",
    marginBottom: 12,
  },

  ai: {
    color: "#2E6CF6",
  },

  subtitle: {
    fontFamily: "InterMedium",
    color: "#4B5563",
    fontSize: 15,
    textAlign: "center",
  },

  middleSpace: {
    flex: 1, // keeps the empty space intact
  },

  buttonContainer: {
    gap: 16,
  },

  primaryButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#2E6CF6",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 16,
  },

  secondaryButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: "#111827",
    fontFamily: "InterSemiBold",
    fontSize: 16,
  },
});
