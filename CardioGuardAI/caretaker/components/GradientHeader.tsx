import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../theme";

interface GradientHeaderProps {
  title:       string;
  subtitle?:   string;
  rightSlot?:  React.ReactNode;
  onBack?:     () => void;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  rightSlot,
  onBack,
}) => {
  return (
    <LinearGradient
      colors={Colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {/* Decorative circle */}
      <View style={styles.decorCircle} />
      <View style={styles.decorCircle2} />

      <View style={styles.inner}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop:    56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    minHeight: 140,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    width:    180,
    height:   180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    top:  -60,
    right: -40,
  },
  decorCircle2: {
    position: "absolute",
    width:    120,
    height:   120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20,
    left:   60,
  },
  inner: {
    flexDirection:  "row",
    alignItems:     "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  backBtn: {
    width:  36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   2,
  },
  textBlock: { flex: 1 },
  title: {
    fontSize:      22,
    fontWeight:    "800",
    color:         "#FFFFFF",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize:   13,
    color:      "rgba(255,255,255,0.75)",
    marginTop:  3,
    lineHeight: 18,
  },
  rightSlot: { marginBottom: 2 },
});