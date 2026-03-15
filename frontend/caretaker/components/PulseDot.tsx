import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

interface PulseDotProps {
  color:  string;
  active: boolean;
  size?:  number;
}

export const PulseDot: React.FC<PulseDotProps> = ({ color, active, size = 10 }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.8, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <View style={{ width: size + 6, height: size + 6, alignItems: "center", justifyContent: "center" }}>
      {active && (
        <Animated.View
          style={{
            position:        "absolute",
            width:           size + 6,
            height:          size + 6,
            borderRadius:    (size + 6) / 2,
            backgroundColor: color,
            transform:       [{ scale }],
            opacity,
          }}
        />
      )}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
};