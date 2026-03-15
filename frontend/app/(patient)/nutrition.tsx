import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ImageBackground,
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

import { colors, spacing, radius, shadows } from "../../constants/theme";
import { analyzeFoodByName, analyzeFoodByImage } from "@/lib/api";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

interface NutritionData {
  food_detected: string;
  nutrition: {
    calories: number;
    fat: number;
    saturated_fat: number;
    sugar: number;
    sodium: number;
  };
  heart_health_risk: RiskLevel;
  reasons: string[];
}

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */

const MOCK_RESULTS: Record<string, NutritionData> = {
  pizza: {
    food_detected: "Pizza",
    nutrition: { calories: 266, fat: 10, saturated_fat: 4.5, sugar: 3, sodium: 640 },
    heart_health_risk: "HIGH",
    reasons: ["High saturated fat", "High sodium content", "Refined carbohydrates"],
  },
  salad: {
    food_detected: "Garden Salad",
    nutrition: { calories: 80, fat: 3, saturated_fat: 0.4, sugar: 4, sodium: 95 },
    heart_health_risk: "LOW",
    reasons: ["Rich in fiber", "Low in saturated fat", "Heart-protective antioxidants"],
  },
  burger: {
    food_detected: "Burger",
    nutrition: { calories: 540, fat: 28, saturated_fat: 11, sugar: 8, sodium: 890 },
    heart_health_risk: "CRITICAL",
    reasons: ["Very high saturated fat", "Excessive sodium", "High calorie density"],
  },
  oats: {
    food_detected: "Oatmeal",
    nutrition: { calories: 150, fat: 3, saturated_fat: 0.5, sugar: 1, sodium: 40 },
    heart_health_risk: "LOW",
    reasons: ["Beta-glucan reduces cholesterol", "Low sodium", "Complex carbohydrates"],
  },
};

const HEALTHIER_ALTERNATIVES: Record<RiskLevel, string[]> = {
  LOW: ["Berries", "Leafy Greens", "Salmon", "Almonds"],
  MODERATE: ["Brown Rice", "Grilled Chicken", "Sweet Potato", "Greek Yogurt"],
  HIGH: ["Oatmeal", "Garden Salad", "Steamed Fish", "Avocado"],
  CRITICAL: ["Oatmeal", "Garden Salad", "Steamed Vegetables", "Fresh Fruit"],
};

const AI_EXPLANATIONS: Record<RiskLevel, string> = {
  LOW: "This food is generally heart-friendly. It provides good nutrients without excessive sodium, saturated fat, or refined sugars. Enjoy it as part of a balanced diet.",
  MODERATE:
    "This food has some nutritional concerns. Moderate consumption is advised. Pair it with plenty of vegetables and watch your overall daily intake.",
  HIGH: "This food is not recommended for heart patients in regular quantities. It contains elevated levels of nutrients that can increase blood pressure and strain your cardiovascular system.",
  CRITICAL:
    "This food poses significant risks for heart patients. The combination of high sodium, saturated fat, and calories can seriously impact cardiovascular health. Avoid or consume very rarely.",
};

/* ─────────────────────────────────────────────
   RISK CONFIGURATION
───────────────────────────────────────────── */

const RISK_CONFIG: Record<
  RiskLevel,
  { color: string; bg: string; label: string; meterPosition: number }
> = {
  LOW: { color: "#10B981", bg: "#ECFDF5", label: "LOW RISK", meterPosition: 0 },
  MODERATE: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    label: "MODERATE RISK",
    meterPosition: 1,
  },
  HIGH: { color: "#EF4444", bg: "#FEF2F2", label: "HIGH RISK", meterPosition: 2 },
  CRITICAL: {
    color: "#991B1B",
    bg: "#FEE2E2",
    label: "CRITICAL RISK",
    meterPosition: 3,
  },
};

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function NutritionTile({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  accent: string;
}) {
  return (
    <View style={[tileStyles.wrap, { borderLeftColor: accent }]}>
      <View style={[tileStyles.iconWrap, { backgroundColor: accent + "18" }]}>
        <Feather name={icon} size={14} color={accent} />
      </View>
      <Text style={tileStyles.value}>
        {value}
        <Text style={tileStyles.unit}> {unit}</Text>
      </Text>
      <Text style={tileStyles.label}>{label}</Text>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    minWidth: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  label: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

function RiskMeter({ level }: { level: RiskLevel }) {
  const segments: { key: RiskLevel; color: string; label: string }[] = [
    { key: "LOW", color: "#10B981", label: "Low" },
    { key: "MODERATE", color: "#F59E0B", label: "Moderate" },
    { key: "HIGH", color: "#EF4444", label: "High" },
    { key: "CRITICAL", color: "#991B1B", label: "Critical" },
  ];

  return (
    <View style={meterStyles.wrap}>
      <View style={meterStyles.track}>
        {segments.map((seg, i) => (
          <View
            key={seg.key}
            style={[
              meterStyles.segment,
              { backgroundColor: seg.color },
              i === 0 && meterStyles.segFirst,
              i === segments.length - 1 && meterStyles.segLast,
              seg.key === level && meterStyles.segActive,
            ]}
          />
        ))}
      </View>
      <View style={meterStyles.labels}>
        {segments.map((seg) => (
          <Text
            key={seg.key}
            style={[
              meterStyles.segLabel,
              seg.key === level && {
                color: seg.color,
                fontWeight: "700",
              },
            ]}
          >
            {seg.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  track: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    gap: 2,
  },
  segment: {
    flex: 1,
    opacity: 0.35,
  },
  segFirst: { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  segLast: { borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  segActive: { opacity: 1 },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  segLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
});

/* ─────────────────────────────────────────────
   SCANNING RING ANIMATION
───────────────────────────────────────────── */

function ScanRing() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={scanStyles.container}>
      <Animated.View style={[scanStyles.outerRing, { transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[scanStyles.spinRing, { transform: [{ rotate }] }]} />
      <View style={scanStyles.imageWrap}>
        <Image
          source={require("../../assets/illustrations/food-scan.png")}
          style={scanStyles.image}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const scanStyles = StyleSheet.create({
  container: {
    width: 160,
    height: 160,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  outerRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.primary + "30",
    borderStyle: "dashed",
  },
  spinRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
  },
  imageWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: 90,
    height: 90,
  },
});

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */

export default function Nutrition() {
  const insets = useSafeAreaInsets();

  const [foodInput, setFoodInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutritionData | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Y-positions captured via onLayout for precise scroll targeting
  const loadingCardY = useRef<number>(0);
  const aiCardY = useRef<number>(0);

  /* ---- Shared post-analysis handler ---- */
  const handleApiResponse = (data: any) => {
    if (data?.error || !data?.food_detected) {
      setErrorMessage("Unable to analyze this food. Please try another item.");
      setLoading(false);
      return;
    }

    const risk = (data.heart_health_risk as RiskLevel) ?? "MODERATE";
    const mapped: NutritionData = {
      food_detected: data.food_detected,
      nutrition: {
        calories: Math.round((data.nutrition?.calories ?? 0) * 100) / 100,
        fat: Math.round((data.nutrition?.fat ?? 0) * 100) / 100,
        saturated_fat: Math.round((data.nutrition?.saturated_fat ?? 0) * 100) / 100,
        sugar: Math.round((data.nutrition?.sugar ?? 0) * 100) / 100,
        sodium: Math.round((data.nutrition?.sodium ?? 0) * 100) / 100,
      },
      heart_health_risk: risk,
      reasons: data.reasons ?? [],
    };

    setLoading(false);
    setResult(mapped);

    // Scroll to the AI Recommendation card once results are painted
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: aiCardY.current, animated: true });
    }, 350);
  };

  /* ---- Text food analysis ---- */
  const analyzeFood = async (foodName: string) => {
    if (!foodName.trim()) return;

    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setShowAlternatives(false);

    // Scroll to loading animation immediately after state update renders
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: loadingCardY.current, animated: true });
    }, 80);

    try {
      const data = await analyzeFoodByName(foodName.trim());
      handleApiResponse(data);
    } catch {
      setLoading(false);
      setErrorMessage("Unable to analyze this food. Please try another item.");
    }
  };

  /* ---- Camera / image analysis ---- */
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const picked = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (picked.canceled || !picked.assets?.[0]) return;

    const base64 = picked.assets[0].base64;
    if (!base64) return;

    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setShowAlternatives(false);

    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: loadingCardY.current, animated: true });
    }, 80);

    try {
      const data = await analyzeFoodByImage(base64);
      handleApiResponse(data);
    } catch {
      setLoading(false);
      setErrorMessage("Unable to analyze this food. Please try another item.");
    }
  };

  const riskCfg = result ? RISK_CONFIG[result.heart_health_risk] : null;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#F5F9FF", "#EEF3FF"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── HERO HEADER ── */}
            <ImageBackground
              source={require("../../assets/hero/nutrition-header.jpg")}
              style={[styles.header, { paddingTop: insets.top }]}
              imageStyle={styles.headerImage}
            >
              <LinearGradient
                colors={["rgba(10,40,90,0.05)", "rgba(10,40,90,0.6)"]}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <View style={styles.headerBadge}>
                    <Feather name="heart" size={12} color="white" />
                    <Text style={styles.headerBadgeText}>CardioGuard AI</Text>
                  </View>
                  <Text style={styles.headerTitle}>Food Health{"\n"}Analyzer</Text>
                  <Text style={styles.headerSubtitle}>
                    Check if your food is safe for your heart.
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>

            {/* ── SCANNER CARD ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.sectionIconWrap}>
                  <Feather name="search" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Analyze Your Food</Text>
                  <Text style={styles.cardSubtitle}>
                    Type a food name or take a photo
                  </Text>
                </View>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pizza, Burger, Salad…"
                  placeholderTextColor="#9CA3AF"
                  value={foodInput}
                  onChangeText={setFoodInput}
                  returnKeyType="search"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => analyzeFood(foodInput)}
                  activeOpacity={0.85}
                >
                  <Feather name="zap" size={16} color="white" />
                  <Text style={styles.primaryBtnText}>Scan Food</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleCamera}
                  activeOpacity={0.85}
                >
                  <Feather name="camera" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <ScanRing />

              <Text style={styles.scanHint}>
                AI-powered nutrition & heart risk analysis
              </Text>
            </View>

            {/* ── ERROR STATE ── */}
            {errorMessage && !loading && (
              <View style={[styles.card, { alignItems: "center", paddingVertical: 24 }]}>
                <Feather name="alert-circle" size={36} color="#EF4444" />
                <Text
                  style={{
                    marginTop: 12,
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#374151",
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* ── LOADING STATE ── */}
            {loading && (
              <View
                style={styles.card}
                onLayout={(e) => {
                  loadingCardY.current = e.nativeEvent.layout.y;
                }}
              >
                <LottieView
                  source={require("../../assets/lottie/ai-processing.json")}
                  autoPlay
                  loop
                  style={styles.loadingLottie}
                />
                <Text style={styles.loadingTitle}>Analyzing nutrition details…</Text>
                <Text style={styles.loadingSubtitle}>
                  Our AI is checking heart safety indicators
                </Text>
              </View>
            )}

            {/* ── RESULTS ── */}
            {result && riskCfg && !loading && (
              <>
                {/* Food + Risk Badge */}
                <View style={styles.card}>
                  <View style={styles.resultHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultLabel}>Food Detected</Text>
                      <Text style={styles.resultFood}>{result.food_detected}</Text>
                    </View>
                    <View
                      style={[
                        styles.riskBadge,
                        { backgroundColor: riskCfg.color + "18" },
                      ]}
                    >
                      <View
                        style={[
                          styles.riskDot,
                          { backgroundColor: riskCfg.color },
                        ]}
                      />
                      <Text style={[styles.riskBadgeText, { color: riskCfg.color }]}>
                        {riskCfg.label}
                      </Text>
                    </View>
                  </View>

                  {/* Risk Meter */}
                  <View style={styles.meterSection}>
                    <Text style={styles.meterTitle}>Heart Risk Level</Text>
                    <RiskMeter level={result.heart_health_risk} />
                  </View>
                </View>

                {/* Nutrition Grid */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.sectionIconWrap}>
                      <Feather name="pie-chart" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>Nutrition Facts</Text>
                      <Text style={styles.cardSubtitle}>Per serving estimate</Text>
                    </View>
                  </View>

                  <View style={styles.nutritionGrid}>
                    <NutritionTile
                      label="Calories"
                      value={result.nutrition.calories}
                      unit="kcal"
                      icon="activity"
                      accent="#3B82F6"
                    />
                    <NutritionTile
                      label="Total Fat"
                      value={result.nutrition.fat}
                      unit="g"
                      icon="droplet"
                      accent="#8B5CF6"
                    />
                    <NutritionTile
                      label="Sat. Fat"
                      value={result.nutrition.saturated_fat}
                      unit="g"
                      icon="alert-triangle"
                      accent="#EF4444"
                    />
                    <NutritionTile
                      label="Sodium"
                      value={result.nutrition.sodium}
                      unit="mg"
                      icon="thermometer"
                      accent="#F59E0B"
                    />
                  </View>
                </View>

                {/* Warning Card */}
                <View
                  style={[
                    styles.warningCard,
                    { backgroundColor: riskCfg.bg, borderColor: riskCfg.color + "40" },
                  ]}
                >
                  <View style={styles.warningHeader}>
                    <Image
                      source={
                        result.heart_health_risk === "LOW"
                          ? require("../../assets/icons/heart-safe.png")
                          : result.heart_health_risk === "MODERATE"
                          ? require("../../assets/icons/heart-warning.png")
                          : require("../../assets/icons/heart-danger.png")
                      }
                      style={styles.warningIcon}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.warningTitle, { color: riskCfg.color }]}>
                        {result.heart_health_risk === "LOW"
                          ? "Heart Safe"
                          : "Heart Health Warning"}
                      </Text>
                      <Text style={styles.warningSubtitle}>Key risk factors identified</Text>
                    </View>
                  </View>
                  <View style={styles.reasonsList}>
                    {result.reasons.map((reason, i) => (
                      <View key={i} style={styles.reasonRow}>
                        <View
                          style={[
                            styles.reasonDot,
                            { backgroundColor: riskCfg.color },
                          ]}
                        />
                        <Text style={[styles.reasonText, { color: riskCfg.color + "CC" }]}>
                          {reason}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* AI Explanation */}
                <View
                  style={styles.aiCard}
                  onLayout={(e) => {
                    aiCardY.current = e.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: "#7C3AED18" }]}>
                      <Feather name="cpu" size={16} color="#7C3AED" />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>AI Recommendation</Text>
                      <Text style={styles.cardSubtitle}>Personalized heart health insight</Text>
                    </View>
                  </View>
                  <Text style={styles.aiText}>
                    {AI_EXPLANATIONS[result.heart_health_risk]}
                  </Text>
                </View>

                {/* Alternatives */}
                <TouchableOpacity
                  style={styles.altBtn}
                  onPress={() => setShowAlternatives(!showAlternatives)}
                  activeOpacity={0.85}
                >
                  <LottieView
                    source={require("../../assets/lottie/healthy-food.json")}
                    autoPlay
                    loop
                    style={styles.altLottie}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.altBtnTitle}>Find Healthier Alternatives</Text>
                    <Text style={styles.altBtnSub}>Heart-safe food options for you</Text>
                  </View>
                  <Feather
                    name={showAlternatives ? "chevron-up" : "chevron-right"}
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>

                {showAlternatives && (
                  <View style={styles.card}>
                    <Text style={styles.altGridTitle}>Heart-Safe Alternatives</Text>
                    <View style={styles.altGrid}>
                      {HEALTHIER_ALTERNATIVES[result.heart_health_risk].map(
                        (food, i) => (
                          <View key={i} style={styles.altChip}>
                            <Text style={styles.altChipEmoji}>🥗</Text>
                            <Text style={styles.altChipText}>{food}</Text>
                          </View>
                        )
                      )}
                    </View>
                    <LottieView
                      source={require("../../assets/lottie/healthy-food.json")}
                      autoPlay
                      loop
                      style={styles.altFullLottie}
                    />
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* ── HEADER ── */
  header: {
    width: "100%",
    height: 260,
    justifyContent: "flex-end",
  },
  headerImage: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerContent: {
    gap: 6,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  headerBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
  },

  /* ── CARDS ── */
  card: {
    backgroundColor: "white",
    margin: spacing.lg,
    marginBottom: 0,
    marginTop: 16,
    padding: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── SCANNER ── */
  inputRow: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  cameraBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary + "40",
    backgroundColor: colors.primary + "08",
    justifyContent: "center",
    alignItems: "center",
  },
  scanHint: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  /* ── LOADING ── */
  loadingLottie: {
    width: 140,
    height: 140,
    alignSelf: "center",
  },
  loadingTitle: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  loadingSubtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    marginBottom: 8,
  },

  /* ── RESULT HEADER ── */
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  resultFood: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  meterSection: {
    gap: 8,
  },
  meterTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  /* ── NUTRITION GRID ── */
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  /* ── WARNING CARD ── */
  warningCard: {
    marginHorizontal: spacing.lg,
    marginTop: 16,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  warningIcon: {
    width: 40,
    height: 40,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  warningSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },
  reasonsList: {
    gap: 8,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "500",
  },

  /* ── AI CARD ── */
  aiCard: {
    backgroundColor: "#F9FAFB",
    marginHorizontal: spacing.lg,
    marginTop: 16,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  aiText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    fontWeight: "400",
  },

  /* ── ALTERNATIVES ── */
  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: spacing.lg,
    marginTop: 16,
    padding: 14,
    borderRadius: radius.xl,
    gap: 10,
    ...shadows.card,
  },
  altLottie: {
    width: 44,
    height: 44,
  },
  altBtnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  altBtnSub: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },
  altGridTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  altGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  altChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  altChipEmoji: {
    fontSize: 14,
  },
  altChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
  altFullLottie: {
    width: 120,
    height: 120,
    alignSelf: "center",
  },
});