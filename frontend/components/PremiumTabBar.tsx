import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Animated, Dimensions, Text } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const TAB_BAR_H  = 70;
const PADDING_H  = 20;
const NUM_TABS   = 4;
const TAB_WIDTH  = (width - PADDING_H * 2) / NUM_TABS;

const ICON_MAP: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  home:      "activity",
  nutrition: "coffee",
  exercise:  "heart",
  profile:   "user",
};

const TAB_LABELS: Record<string, string> = {
  home:      "Home",
  nutrition: "Nutrition",
  exercise:  "Exercise",
  profile:   "Profile",
};

const ACTIVE_COLOR   = "#2563EB";
const INACTIVE_COLOR = "#94A3B8";

export default function PremiumTabBar({ state, navigation }: BottomTabBarProps) {
  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Sliding active pill */}
        <Animated.View
          style={[styles.activePill, { transform: [{ translateX: indicatorX }] }]}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName  = ICON_MAP[route.name.toLowerCase()] ?? "circle";
          const label     = TAB_LABELS[route.name.toLowerCase()] ?? route.name;

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
              android_ripple={{ color: "rgba(37,99,235,0.1)", borderless: true }}
            >
              <Animated.View style={styles.tabInner}>
                <Feather
                  name={iconName}
                  size={21}
                  color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
                      fontWeight: isFocused ? "700" : "500" },
                  ]}
                >
                  {label}
                </Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 24,
    left: PADDING_H,
    right: PADDING_H,
  },
  container: {
    flexDirection: "row",
    height: TAB_BAR_H,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.08)",
  },
  activePill: {
    position: "absolute",
    width: TAB_WIDTH,
    height: "100%",
    borderRadius: 26,
    backgroundColor: "rgba(37,99,235,0.08)",
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabInner: {
    alignItems: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});