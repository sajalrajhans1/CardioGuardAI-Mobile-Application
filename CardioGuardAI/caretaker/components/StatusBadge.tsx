import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { STATUS_CONFIG, HeartStatus, Radius } from "../theme";

interface StatusBadgeProps {
  status: HeartStatus;
  size?:  "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const cfg = STATUS_CONFIG[status];

  const fontSize  = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  const iconSize  = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  const padH      = size === "sm" ? 8  : size === "lg" ? 14 : 10;
  const padV      = size === "sm" ? 3  : size === "lg" ? 6  : 4;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          paddingHorizontal: padH,
          paddingVertical:   padV,
        },
      ]}
    >
      <Feather name={cfg.icon as any} size={iconSize} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color, fontSize }]}>
        {cfg.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection:  "row",
    alignItems:     "center",
    borderRadius:   Radius.full,
    gap:            4,
    alignSelf:      "flex-start",
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});