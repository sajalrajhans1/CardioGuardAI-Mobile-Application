import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCaretakerWs } from "../../../caretaker/CaretakerWsContext";
import { GradientHeader } from "../../../caretaker/components/GradientHeader";
import { StatusBadge }    from "../../../caretaker/components/StatusBadge";
import { Colors, Shadow, Radius, STATUS_CONFIG, HeartStatus } from "../../../caretaker/theme";

// ─── Static diet guidance by status ──────────────────────────────────────────

interface FoodItem {
  name:    string;
  reason:  string;
  icon:    string;
}

interface DietPlan {
  title:    string;
  summary:  string;
  eat:      FoodItem[];
  avoid:    FoodItem[];
  tips:     string[];
}

const DIET_PLANS: Record<HeartStatus, DietPlan> = {
  NORMAL: {
    title:   "Heart-Healthy Diet",
    summary: "Maintain a balanced, nutrient-rich diet to support consistent heart function.",
    eat: [
      { name: "Oats & whole grains",   reason: "Lowers LDL cholesterol",        icon: "🌾" },
      { name: "Salmon / fatty fish",   reason: "Omega-3 supports heart rhythm",  icon: "🐟" },
      { name: "Berries & fruit",        reason: "Antioxidants reduce inflammation",icon: "🫐" },
      { name: "Leafy greens",          reason: "Rich in vitamins K, B9",         icon: "🥬" },
      { name: "Nuts & seeds",          reason: "Healthy fats, magnesium",        icon: "🥜" },
      { name: "Low-fat dairy / yogurt",reason: "Calcium for heart muscle",       icon: "🥛" },
    ],
    avoid: [
      { name: "Processed meats",       reason: "High sodium raises BP",          icon: "🥩" },
      { name: "Sugary drinks",         reason: "Spikes triglycerides",           icon: "🥤" },
      { name: "Trans fats",            reason: "Clogs arteries",                 icon: "🍟" },
    ],
    tips: [
      "Aim for 8 glasses of water per day.",
      "Eat smaller meals every 3–4 hours.",
      "Limit salt to under 2,300 mg/day.",
    ],
  },
  WARNING: {
    title:   "Cautious Heart Diet",
    summary: "Heart rate is slightly elevated or low. Focus on calming, anti-inflammatory foods.",
    eat: [
      { name: "Bananas",               reason: "Potassium regulates heart rate", icon: "🍌" },
      { name: "Avocado",               reason: "Healthy fats, lowers stress",    icon: "🥑" },
      { name: "Warm herbal tea",        reason: "Chamomile calms heart rhythm",  icon: "🍵" },
      { name: "Dark chocolate (70%+)", reason: "Flavonoids improve circulation", icon: "🍫" },
      { name: "Spinach",               reason: "Magnesium supports rhythm",      icon: "🥬" },
      { name: "Sweet potato",          reason: "Potassium, low GI energy",       icon: "🍠" },
    ],
    avoid: [
      { name: "Caffeine & energy drinks", reason: "Can raise heart rate",        icon: "☕" },
      { name: "Spicy or heavy meals",  reason: "Can trigger palpitations",       icon: "🌶️" },
      { name: "Alcohol",               reason: "Disrupts heart rhythm",          icon: "🍷" },
      { name: "High-sodium snacks",    reason: "Increases blood pressure",       icon: "🍿" },
    ],
    tips: [
      "Keep meals light — avoid overeating.",
      "Stay well-hydrated; dehydration worsens BPM irregularities.",
      "Rest after meals; avoid strenuous activity immediately after eating.",
    ],
  },
  CRITICAL: {
    title:   "Emergency Diet Protocol",
    summary: "BPM is in critical range. Prioritise hydration and light, easily digestible foods. Seek medical help immediately if needed.",
    eat: [
      { name: "Water / electrolyte drinks", reason: "Restores mineral balance",  icon: "💧" },
      { name: "Plain crackers / toast",  reason: "Light, easy to digest",        icon: "🍞" },
      { name: "Coconut water",          reason: "Natural electrolytes",          icon: "🥥" },
      { name: "Banana",                 reason: "Potassium stabilises rhythm",   icon: "🍌" },
      { name: "Light broth / soup",     reason: "Hydrating, no cardiac stimulants",icon: "🍲" },
    ],
    avoid: [
      { name: "Any caffeinated drinks", reason: "Dangerous when BPM is critical",icon: "☕" },
      { name: "Heavy or fatty meals",   reason: "Diverts blood from heart",      icon: "🍔" },
      { name: "Alcohol",                reason: "Life-threatening at this stage", icon: "🍷" },
      { name: "Salt-heavy foods",       reason: "Worsens blood pressure",        icon: "🧂" },
      { name: "Sugary foods",           reason: "Unstable blood sugar stresses heart",icon: "🍭" },
    ],
    tips: [
      "⚠️ Contact a doctor or emergency services if BPM stays critical.",
      "Keep the patient calm and seated or lying down.",
      "Do not give food if the patient is feeling faint or nauseous.",
    ],
  },
};

// ─── Food chip ────────────────────────────────────────────────────────────────

const FoodChip: React.FC<{ item: FoodItem; type: "eat" | "avoid" }> = ({ item, type }) => (
  <View style={[feedStyles.chip, type === "avoid" && feedStyles.chipAvoid]}>
    <Text style={feedStyles.chipEmoji}>{item.icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={[feedStyles.chipName, type === "avoid" && feedStyles.chipNameAvoid]}>
        {item.name}
      </Text>
      <Text style={feedStyles.chipReason}>{item.reason}</Text>
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WhatToFeed() {
  const { vitals } = useCaretakerWs();
  const plan       = DIET_PLANS[vitals.status];
  const cfg        = STATUS_CONFIG[vitals.status];

  return (
    <View style={feedStyles.root}>
      <GradientHeader
        title="What to Feed"
        subtitle="Diet guidance based on live heart status"
      />

      <ScrollView
        style={feedStyles.scroll}
        contentContainerStyle={feedStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status banner ── */}
        <LinearGradient
          colors={[cfg.color + "22", cfg.color + "08"]}
          style={feedStyles.statusBanner}
        >
          <View style={[feedStyles.statusIconWrap, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon as any} size={20} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text style={feedStyles.planTitle}>{plan.title}</Text>
              <StatusBadge status={vitals.status} size="sm" />
            </View>
            <Text style={feedStyles.planSummary}>{plan.summary}</Text>
            {vitals.bpm > 0 && (
              <Text style={[feedStyles.bpmNote, { color: cfg.color }]}>
                Current BPM: {vitals.bpm}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* ── Eat section ── */}
        <View style={feedStyles.sectionCard}>
          <View style={feedStyles.sectionHead}>
            <View style={[feedStyles.sectionDot, { backgroundColor: Colors.normalBg }]}>
              <Feather name="check-circle" size={14} color={Colors.normal} />
            </View>
            <Text style={[feedStyles.sectionHeadText, { color: Colors.normal }]}>
              Recommended Foods
            </Text>
          </View>
          {plan.eat.map((item, i) => (
            <FoodChip key={i} item={item} type="eat" />
          ))}
        </View>

        {/* ── Avoid section ── */}
        <View style={feedStyles.sectionCard}>
          <View style={feedStyles.sectionHead}>
            <View style={[feedStyles.sectionDot, { backgroundColor: Colors.criticalBg }]}>
              <Feather name="x-circle" size={14} color={Colors.critical} />
            </View>
            <Text style={[feedStyles.sectionHeadText, { color: Colors.critical }]}>
              Foods to Avoid
            </Text>
          </View>
          {plan.avoid.map((item, i) => (
            <FoodChip key={i} item={item} type="avoid" />
          ))}
        </View>

        {/* ── Tips ── */}
        <View style={feedStyles.tipsCard}>
          <View style={feedStyles.sectionHead}>
            <View style={[feedStyles.sectionDot, { backgroundColor: Colors.blue50 }]}>
              <Feather name="info" size={14} color={Colors.blue600} />
            </View>
            <Text style={[feedStyles.sectionHeadText, { color: Colors.blue700 }]}>
              Caretaker Tips
            </Text>
          </View>
          {plan.tips.map((tip, i) => (
            <View key={i} style={feedStyles.tipRow}>
              <View style={feedStyles.tipBullet} />
              <Text style={feedStyles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <Text style={feedStyles.disclaimer}>
          This guidance is informational only and not a substitute for medical advice.
          Consult a healthcare professional for personalised dietary recommendations.
        </Text>
      </ScrollView>
    </View>
  );
}

const feedStyles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.gray100 },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },

  statusBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    borderRadius: Radius.xl, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.gray200,
  },
  statusIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  planTitle:   { fontSize: 16, fontWeight: "800", color: Colors.gray900, letterSpacing: -0.2 },
  planSummary: { fontSize: 13, color: Colors.gray600, lineHeight: 18 },
  bpmNote:     { fontSize: 12, fontWeight: "700", marginTop: 4 },

  sectionCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    overflow: "hidden", marginBottom: 12, ...Shadow.soft,
  },
  tipsCard: {
    backgroundColor: Colors.blue50, borderRadius: Radius.lg,
    overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: Colors.blue100,
  },
  sectionHead: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  sectionDot: {
    width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  sectionHeadText: { fontSize: 14, fontWeight: "700", letterSpacing: 0.1 },

  chip: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.gray50,
  },
  chipAvoid: { backgroundColor: "#FFF9F9" },
  chipEmoji: { fontSize: 22, width: 30, textAlign: "center" },
  chipName:  { fontSize: 14, fontWeight: "600", color: Colors.gray800 },
  chipNameAvoid: { color: Colors.critical },
  chipReason:{ fontSize: 11, color: Colors.gray400, marginTop: 1 },

  tipRow:    { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 8 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.blue400, marginTop: 5 },
  tipText:   { flex: 1, fontSize: 13, color: Colors.blue800, lineHeight: 18 },

  disclaimer: {
    fontSize: 11, color: Colors.gray400, textAlign: "center",
    lineHeight: 16, paddingHorizontal: 8, marginBottom: 8,
  },
});