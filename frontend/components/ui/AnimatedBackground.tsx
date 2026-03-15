import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const PARTICLE_COUNT = 8;

export default function AnimatedBackground({ children }: any) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      size: 30 + Math.random() * 40,
      opacity: 0.06 + Math.random() * 0.05,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(p.x, {
              toValue: Math.random() * width,
              duration: 8000 + Math.random() * 6000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(p.y, {
              toValue: Math.random() * height,
              duration: 8000 + Math.random() * 6000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Base Gradient */}
      <LinearGradient
        colors={["#F7FAFF", "#EDF3FF", "#F7FAFF"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Micro Particles */}
      {particles.map((p, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
              ],
            },
          ]}
        />
      ))}

      {/* Grain Overlay */}
      <View pointerEvents="none" style={styles.grainOverlay} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    backgroundColor: "#CFE0FF",
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
});