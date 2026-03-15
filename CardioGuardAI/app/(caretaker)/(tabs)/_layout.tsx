import React, { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import {
  View, Text, StyleSheet, Pressable,
  Animated, Dimensions,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { CaretakerWsProvider, useCaretakerWs } from "../../../caretaker/CaretakerWsContext";
import { Colors } from "../../../caretaker/theme";

// ─── Constants (mirrors PremiumTabBar from patient side) ──────────────────────

const { width }  = Dimensions.get("window");
const TAB_BAR_H  = 70;
const PADDING_H  = 20;
const NUM_TABS   = 4;
const TAB_WIDTH  = (width - PADDING_H * 2) / NUM_TABS;

const ACTIVE_COLOR   = "#2563EB";
const INACTIVE_COLOR = "#94A3B8";

const ICON_MAP: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  dashboard:        "activity",
  alerts:           "bell",
  "patient-details":"user",
  "what-to-feed":   "coffee",
};

const LABEL_MAP: Record<string, string> = {
  dashboard:         "Dashboard",
  alerts:            "Alerts",
  "patient-details": "Patient",
  "what-to-feed":    "Diet",
};

// ─── PremiumTabBar (caretaker edition — identical pattern, adds alert badge) ──

function CaretakerTabBar({ state, navigation }: BottomTabBarProps) {
  const { vitals }  = useCaretakerWs();
  const unread      = vitals.alerts.filter((a) => !a.read).length;
  const indicatorX  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue:      state.index * TAB_WIDTH,
      useNativeDriver: true,
      speed:        20,
      bounciness:   6,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>

        {/* Sliding active pill — identical to patient PremiumTabBar */}
        <Animated.View
          style={[styles.activePill, { transform: [{ translateX: indicatorX }] }]}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName  = ICON_MAP[route.name] ?? "circle";
          const label     = LABEL_MAP[route.name] ?? route.name;
          const badge     = route.name === "alerts" ? unread : 0;

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
              android_ripple={{ color: "rgba(37,99,235,0.1)", borderless: true }}
            >
              <View style={styles.tabInner}>
                {/* Icon + badge wrapper */}
                <View style={styles.iconWrap}>
                  <Feather
                    name={iconName}
                    size={21}
                    color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
                  />
                  {badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {badge > 9 ? "9+" : badge}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color:      isFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
                      fontWeight: isFocused ? "700" : "500",
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Inner tabs — passes CaretakerTabBar as tabBar prop ───────────────────────

function InnerTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CaretakerTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard"        />
      <Tabs.Screen name="alerts"           />
      <Tabs.Screen name="patient-details"  />
      <Tabs.Screen name="what-to-feed"     />
    </Tabs>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function CaretakerTabsLayout() {
  return (
    <CaretakerWsProvider>
      <InnerTabs />
    </CaretakerWsProvider>
  );
}

// ─── Styles (mirrors patient PremiumTabBar exactly) ───────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom:   24,
    left:     PADDING_H,
    right:    PADDING_H,
  },
  container: {
    flexDirection:   "row",
    height:          TAB_BAR_H,
    borderRadius:    26,
    backgroundColor: "#FFFFFF",
    overflow:        "hidden",
    shadowColor:     "#1E3A8A",
    shadowOpacity:   0.14,
    shadowRadius:    24,
    shadowOffset:    { width: 0, height: 10 },
    elevation:       18,
    borderWidth:     1,
    borderColor:     "rgba(37,99,235,0.08)",
  },
  activePill: {
    position:        "absolute",
    width:           TAB_WIDTH,
    height:          "100%",
    borderRadius:    26,
    backgroundColor: "rgba(37,99,235,0.08)",
  },
  tab: {
    flex:           1,
    justifyContent: "center",
    alignItems:     "center",
  },
  tabInner: {
    alignItems: "center",
    gap:        3,
  },
  iconWrap: {
    position: "relative",    // anchor for the badge
    alignItems:     "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize:      10,
    letterSpacing: 0.2,
  },
  badge: {
    position:        "absolute",
    top:             -4,
    right:           -8,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: "#DC2626",
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 3,
    borderWidth:     1.5,
    borderColor:     "#FFFFFF",
  },
  badgeText: {
    fontSize:   9,
    fontWeight: "800",
    color:      "#FFFFFF",
  },
});