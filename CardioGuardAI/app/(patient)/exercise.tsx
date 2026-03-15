import React, { useContext, useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  ImageBackground,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import Svg, { Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

import { colors, spacing, radius, shadows } from "../../constants/theme";
import { ProfileContext } from "../../context/ProfileContext";

type Phase = "INHALE" | "HOLD" | "EXHALE";

type IntensityLevel = "Recovery" | "Low" | "Moderate" | "High";

const INTENSITY_COLORS: Record<IntensityLevel, string> = {
  Recovery: "#10B981",
  Low: "#3B82F6",
  Moderate: "#F59E0B",
  High: "#EF4444",
};

const KCAL_PER_MIN: Record<string, number> = {
  Jogging: 8,
  Cycling: 6,
  Walking: 4,
};

/* Mock streak — replace with persisted value later */
const EXERCISE_STREAK = 3;

export default function Exercise() {
  const { profile } = useContext(ProfileContext);
  const insets = useSafeAreaInsets();
  const age = profile?.age ?? 20;

  /* ---------------- BREATHING PATTERN ---------------- */

  const breathingPattern =
    age < 30
      ? { inhale: 4, hold: 2, exhale: 6 }
      : age < 50
      ? { inhale: 4, hold: 3, exhale: 6 }
      : { inhale: 3, hold: 2, exhale: 5 };

  const [phase, setPhase] = useState<Phase>("INHALE");
  const [secondsLeft, setSecondsLeft] = useState(breathingPattern.inhale);
  const [breathingActive, setBreathingActive] = useState(false);

  /* ---------------- BREATHING ANIMATION ---------------- */

  const innerScale = useRef(new Animated.Value(1)).current;
  const outerScale = useRef(new Animated.Value(1)).current;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathingActiveRef = useRef(false);

  const stopBreathing = useCallback(() => {
    breathingActiveRef.current = false;
    setBreathingActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    innerScale.stopAnimation();
    outerScale.stopAnimation();

    Animated.parallel([
      Animated.timing(innerScale, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(outerScale, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    setPhase("INHALE");
    setSecondsLeft(breathingPattern.inhale);
  }, [breathingPattern.inhale, innerScale, outerScale]);

  const animateBreathing = useCallback(
    (target: number, duration: number) => {
      Animated.parallel([
        Animated.timing(innerScale, {
          toValue: target,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(outerScale, {
            toValue: 1.12,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(outerScale, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
    [innerScale, outerScale]
  );

  const runPhase = useCallback(
    (p: Phase) => {
      if (!breathingActiveRef.current) return;

      const duration =
        p === "INHALE"
          ? breathingPattern.inhale
          : p === "HOLD"
          ? breathingPattern.hold
          : breathingPattern.exhale;

      setPhase(p);
      setSecondsLeft(duration);

      if (p === "INHALE") animateBreathing(1.25, duration * 1000);
      else if (p === "EXHALE") animateBreathing(1, duration * 1000);

      let counter = duration;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      intervalRef.current = setInterval(() => {
        if (!breathingActiveRef.current) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return;
        }

        counter--;
        setSecondsLeft(counter);

        if (counter <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;

          if (!breathingActiveRef.current) return;

          if (p === "INHALE") runPhase("HOLD");
          else if (p === "HOLD") runPhase("EXHALE");
          else runPhase("INHALE");
        }
      }, 1000);
    },
    [breathingPattern, animateBreathing]
  );

  const startBreathing = useCallback(() => {
    if (breathingActiveRef.current) return;
    breathingActiveRef.current = true;
    setBreathingActive(true);
    setTimeout(() => runPhase("INHALE"), 50);
  }, [runPhase]);

  useEffect(() => {
    return () => {
      breathingActiveRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* ---------------- EXERCISES ---------------- */

  const exercises: {
    name: string;
    description: string;
    animation: any;
    icon: React.ComponentProps<typeof Feather>["name"];
    color: string;
    intensity: IntensityLevel;
  }[] = [
    {
      name: "Jogging",
      description: "Improves cardiovascular endurance and strengthens heart muscles.",
      animation: require("../../assets/lottie/jogging.json"),
      icon: "trending-up",
      color: "#3B82F6",
      intensity: "Moderate",
    },
    {
      name: "Cycling",
      description: "Low-impact cardio that improves heart efficiency.",
      animation: require("../../assets/lottie/cycling.json"),
      icon: "refresh-cw",
      color: "#10B981",
      intensity: "Low",
    },
    {
      name: "Walking",
      description: "A safe exercise that improves blood circulation.",
      animation: require("../../assets/lottie/walking.json"),
      icon: "navigation",
      color: "#8B5CF6",
      intensity: "Recovery",
    },
  ];

  /* ---------------- EXERCISE MODAL ---------------- */

  const [exerciseModal, setExerciseModal] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseAnimation, setExerciseAnimation] = useState<any>(null);
  const [exerciseColor, setExerciseColor] = useState("#3B82F6");

  /* Fix: string state to allow full backspace/clear */
  const [sessionTimeInput, setSessionTimeInput] = useState("15");
  const [sessionCountInput, setSessionCountInput] = useState("3");

  const sessionTime = Math.max(1, parseInt(sessionTimeInput) || 1);
  const sessionCount = Math.max(1, parseInt(sessionCountInput) || 1);

  const sessionTimeRef = useRef(15);
  const sessionCountRef = useRef(3);

  const [currentSession, setCurrentSession] = useState(1);
  const [seconds, setSeconds] = useState(sessionTime * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sessionTimeRef.current = sessionTime;
    if (!timerRunning) {
      setSeconds(sessionTime * 60);
    }
  }, [sessionTime, timerRunning]);

  useEffect(() => {
    sessionCountRef.current = sessionCount;
  }, [sessionCount]);

  const openExercise = (exercise: any) => {
    setExerciseName(exercise.name);
    setExerciseAnimation(exercise.animation);
    setExerciseColor(exercise.color);
    setExerciseModal(true);
    setCurrentSession(1);
    setSeconds(sessionTimeRef.current * 60);
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    setTimerRunning(true);

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;

          setCurrentSession((s) => {
            if (s < sessionCountRef.current) {
              const next = s + 1;
              setTimeout(() => {
                setSeconds(sessionTimeRef.current * 60);
                timerRef.current = setInterval(() => {
                  setSeconds((p) => {
                    if (p <= 1) {
                      clearInterval(timerRef.current!);
                      timerRef.current = null;
                      setTimerRunning(false);
                      return 0;
                    }
                    return p - 1;
                  });
                }, 1000);
              }, 500);
              return next;
            }
            setTimerRunning(false);
            return s;
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setSeconds(sessionTimeRef.current * 60);
    setCurrentSession(1);
  };

  const closeModal = () => {
    pauseTimer();
    setExerciseModal(false);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ---------------- PROGRESS RING ---------------- */

  const radiusRing = 90;
  const circumference = 2 * Math.PI * radiusRing;
  const totalSecs = sessionTime * 60;
  const progress = totalSecs > 0 ? seconds / totalSecs : 0;
  const strokeDashoffset = circumference * (1 - progress);

  /* ---------------- CALORIES ---------------- */

  const elapsedMinutes = (totalSecs - seconds) / 60;
  const kcalRate = KCAL_PER_MIN[exerciseName] ?? 5;
  const estimatedCalories = Math.round(elapsedMinutes * kcalRate);

  /* ---------------- SESSION PROGRESS BAR ---------------- */

  const sessionProgress =
    sessionCount > 1 ? (currentSession - 1) / (sessionCount - 1) : 0;

  /* ---------------- UI ---------------- */

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#F5F9FF", "#EEF3FF"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ---- HERO HEADER ---- */}
          <ImageBackground
            source={require("../../assets/hero/exercise-header.jpg")}
            style={[styles.header, { paddingTop: insets.top }]}
            imageStyle={styles.headerImage}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.55)"]}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Exercise Therapy</Text>
                <Text style={styles.headerSubtitle}>
                  Strengthen your heart with guided movement
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          {/* ---- STREAK BADGE ---- */}
          <View style={styles.streakRow}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>
                Exercise Streak: {EXERCISE_STREAK} days
              </Text>
            </View>
          </View>

          {/* ---- BREATHING CARD ---- */}
          <View style={styles.breathCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Feather name="wind" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Calming Breathing</Text>
                <Text style={styles.breathDesc}>
                  Helps stabilize heart rhythm and reduce stress
                </Text>
              </View>
            </View>

            <View style={styles.breathContainer}>
              <Animated.View
                style={[styles.outerRing, { transform: [{ scale: outerScale }] }]}
              />
              <Animated.View
                style={[styles.innerRing, { transform: [{ scale: innerScale }] }]}
              >
                <Text style={styles.phaseText}>{phase}</Text>
                <Text style={styles.secondsText}>{secondsLeft}s</Text>
              </Animated.View>
            </View>

            <View style={styles.phaseRow}>
              <View
                style={[styles.phasePill, phase === "INHALE" && styles.phasePillActive]}
              >
                <Text
                  style={phase === "INHALE" ? styles.phaseActive : styles.phaseInactive}
                >
                  Inhale
                </Text>
              </View>
              <View
                style={[styles.phasePill, phase === "HOLD" && styles.phasePillActive]}
              >
                <Text
                  style={phase === "HOLD" ? styles.phaseActive : styles.phaseInactive}
                >
                  Hold
                </Text>
              </View>
              <View
                style={[styles.phasePill, phase === "EXHALE" && styles.phasePillActive]}
              >
                <Text
                  style={phase === "EXHALE" ? styles.phaseActive : styles.phaseInactive}
                >
                  Exhale
                </Text>
              </View>
            </View>

            {!breathingActive ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={startBreathing}>
                <Feather name="play" size={18} color="white" />
                <Text style={styles.btnText}>Start Breathing</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopBtn} onPress={stopBreathing}>
                <Feather name="square" size={18} color="white" />
                <Text style={styles.btnText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ---- RECOVERY TIP ---- */}
          <View style={styles.recoveryCard}>
            <View style={styles.recoveryIconWrap}>
              <Feather name="heart" size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recoveryTitle}>Recovery Tip</Text>
              <Text style={styles.recoveryText}>
                Try a 2-minute breathing session after intense exercise to help your
                heart rate return to baseline.
              </Text>
            </View>
          </View>

          {/* ---- EXERCISES SECTION ---- */}
          <View style={styles.exercisesSection}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionIconWrap}>
                <Feather name="activity" size={16} color={colors.primary} />
              </View>
              <Text style={styles.exercisesSectionTitle}>Recommended Exercises</Text>
            </View>

            {exercises.map((exercise) => (
              <View key={exercise.name} style={styles.exerciseCard}>
                <View
                  style={[
                    styles.lottieWrap,
                    { backgroundColor: exercise.color + "15" },
                  ]}
                >
                  <LottieView
                    source={exercise.animation}
                    autoPlay
                    loop
                    style={styles.lottieThumb}
                  />
                </View>

                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseTitleRow}>
                    <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                    <View
                      style={[
                        styles.intensityBadge,
                        {
                          backgroundColor:
                            INTENSITY_COLORS[exercise.intensity] + "20",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.intensityDot,
                          {
                            backgroundColor:
                              INTENSITY_COLORS[exercise.intensity],
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.intensityLabel,
                          { color: INTENSITY_COLORS[exercise.intensity] },
                        ]}
                      >
                        {exercise.intensity}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.exerciseDesc}>{exercise.description}</Text>

                  <View style={styles.exerciseFooter}>
                    <Text style={styles.kcalHint}>
                      ~{KCAL_PER_MIN[exercise.name]} kcal/min
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.startExerciseBtn,
                        { backgroundColor: exercise.color },
                      ]}
                      onPress={() => openExercise(exercise)}
                    >
                      <Feather name="play" size={13} color="white" />
                      <Text style={styles.startExerciseBtnText}>Start Session</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ---------------- EXERCISE MODAL ---------------- */}
        <Modal visible={exerciseModal} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F9FF" }}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <LinearGradient colors={["#F5F9FF", "#EEF3FF"]} style={{ flex: 1 }}>
                <ScrollView
                  contentContainerStyle={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Modal header */}
                  <View style={styles.modalHeader}>
                    <TouchableOpacity style={styles.closeIcon} onPress={closeModal}>
                      <Feather name="x" size={20} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{exerciseName}</Text>
                    <View style={{ width: 36 }} />
                  </View>

                  {exerciseAnimation && (
                    <LottieView
                      source={exerciseAnimation}
                      autoPlay
                      loop
                      style={styles.lottieFull}
                    />
                  )}

                  {/* Timer card */}
                  <View style={styles.timerCard}>
                    <View style={styles.timerCircle}>
                      <Svg width={220} height={220}>
                        {/* Soft glow ring */}
                        <Circle
                          stroke={exerciseColor + "22"}
                          fill="none"
                          cx="110"
                          cy="110"
                          r={radiusRing}
                          strokeWidth="18"
                        />
                        {/* Track */}
                        <Circle
                          stroke="#E5E7EB"
                          fill="none"
                          cx="110"
                          cy="110"
                          r={radiusRing}
                          strokeWidth="10"
                        />
                        {/* Progress */}
                        <Circle
                          stroke={exerciseColor}
                          fill="none"
                          cx="110"
                          cy="110"
                          r={radiusRing}
                          strokeWidth="10"
                          strokeDasharray={`${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          rotation="-90"
                          origin="110, 110"
                        />
                      </Svg>

                      <View style={styles.timerInner}>
                        <Text style={[styles.timerText, { color: exerciseColor }]}>
                          {formatTime(seconds)}
                        </Text>
                        <Text style={styles.sessionLabel}>
                          Session {currentSession} of {sessionCount}
                        </Text>
                      </View>
                    </View>

                    {/* Session progress bar */}
                    <View style={styles.sessionProgressWrap}>
                      <View style={styles.sessionProgressTrack}>
                        <View
                          style={[
                            styles.sessionProgressFill,
                            {
                              width: `${sessionProgress * 100}%`,
                              backgroundColor: exerciseColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.sessionProgressText}>
                        {currentSession}/{sessionCount} sessions completed
                      </Text>
                    </View>

                    {/* Calories */}
                    <View style={styles.caloriesRow}>
                      <Feather name="zap" size={14} color="#F59E0B" />
                      <Text style={styles.caloriesText}>
                        ~{estimatedCalories} kcal burned
                      </Text>
                      <Text style={styles.caloriesRate}>({kcalRate} kcal/min)</Text>
                    </View>
                  </View>

                  {/* Inputs */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputSectionLabel}>Session Settings</Text>
                    <View style={styles.inputRow}>
                      <View style={styles.inputBox}>
                        <Text style={styles.inputLabel}>Minutes / Session</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={sessionTimeInput}
                          onChangeText={(t) => setSessionTimeInput(t)}
                          onBlur={() => {
                            const val = parseInt(sessionTimeInput);
                            if (!val || val < 1) setSessionTimeInput("1");
                          }}
                          selectTextOnFocus
                        />
                      </View>
                      <View style={styles.inputBox}>
                        <Text style={styles.inputLabel}>Sessions</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={sessionCountInput}
                          onChangeText={(t) => setSessionCountInput(t)}
                          onBlur={() => {
                            const val = parseInt(sessionCountInput);
                            if (!val || val < 1) setSessionCountInput("1");
                          }}
                          selectTextOnFocus
                        />
                      </View>
                    </View>
                  </View>

                  {/* Controls */}
                  <View style={styles.timerControls}>
                    <TouchableOpacity
                      style={[styles.controlBtn, { backgroundColor: exerciseColor }]}
                      onPress={startTimer}
                    >
                      <Feather name="play" size={16} color="white" />
                      <Text style={styles.btnText}>Start</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.controlBtn, styles.pauseBtn]}
                      onPress={pauseTimer}
                    >
                      <Feather name="pause" size={16} color="white" />
                      <Text style={styles.btnText}>Pause</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.controlBtn, styles.resetBtn]}
                      onPress={resetTimer}
                    >
                      <Feather name="refresh-cw" size={16} color="#374151" />
                      <Text style={styles.secondaryBtnText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </LinearGradient>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ---- HEADER ---- */
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
  headerTitle: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "400",
  },

  /* ---- STREAK ---- */
  streakRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 2,
    alignItems: "flex-start",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },

  /* ---- SECTION UTILS ---- */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---- BREATHING CARD ---- */
  breathCard: {
    backgroundColor: "white",
    margin: spacing.lg,
    marginBottom: 10,
    padding: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  breathDesc: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  breathContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    marginVertical: 8,
  },
  outerRing: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#E8F0FF",
    opacity: 0.7,
  },
  innerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#93C5FD",
  },
  phaseText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
  },
  secondsText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
  },
  phaseRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  phasePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  phasePillActive: {
    backgroundColor: colors.primary + "18",
  },
  phaseActive: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  phaseInactive: {
    color: "#9CA3AF",
    fontSize: 13,
  },

  /* ---- RECOVERY TIP ---- */
  recoveryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F0FDF4",
    marginHorizontal: spacing.lg,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  recoveryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  recoveryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 3,
  },
  recoveryText: {
    fontSize: 12,
    color: "#047857",
    lineHeight: 17,
  },

  /* ---- BUTTONS ---- */
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  stopBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },

  /* ---- EXERCISES SECTION ---- */
  exercisesSection: {
    marginHorizontal: spacing.lg,
    marginTop: 4,
  },
  exercisesSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  exerciseCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 18,
    marginBottom: 14,
    padding: 16,
    alignItems: "center",
    gap: 14,
    ...shadows.card,
  },
  lottieWrap: {
    width: 80,
    height: 80,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  lottieThumb: {
    width: 80,
    height: 80,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  exerciseTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: "#111827",
    letterSpacing: -0.3,
  },
  intensityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  intensityLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  exerciseDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  exerciseFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  kcalHint: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  startExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startExerciseBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ---- MODAL ---- */
  modalScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  closeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  lottieFull: {
    height: 130,
    alignSelf: "center",
  },

  /* ---- TIMER CARD ---- */
  timerCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  timerCircle: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  timerInner: {
    position: "absolute",
    alignItems: "center",
  },
  timerText: {
    fontSize: 46,
    fontWeight: "800",
    letterSpacing: -2,
  },
  sessionLabel: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },

  /* ---- SESSION PROGRESS ---- */
  sessionProgressWrap: {
    width: "100%",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sessionProgressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  sessionProgressFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 6,
  },
  sessionProgressText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  /* ---- CALORIES ---- */
  caloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  caloriesText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  caloriesRate: {
    fontSize: 11,
    color: "#B45309",
  },

  /* ---- INPUT SECTION ---- */
  inputSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputBox: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    backgroundColor: "#FAFAFA",
    textAlign: "center",
  },

  /* ---- TIMER CONTROLS ---- */
  timerControls: {
    flexDirection: "row",
    gap: 10,
  },
  controlBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },
  pauseBtn: {
    backgroundColor: "#DC2626",
  },
  resetBtn: {
    backgroundColor: "#F3F4F6",
  },
});