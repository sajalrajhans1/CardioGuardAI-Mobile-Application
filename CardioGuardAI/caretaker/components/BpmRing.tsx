import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { STATUS_CONFIG, HeartStatus, Colors } from "../theme";

interface BpmRingProps {
  bpm:    number;
  status: HeartStatus;
  size?:  number;
}

export const BpmRing: React.FC<BpmRingProps> = ({ bpm, status, size = 140 }) => {
  const progress    = useRef(new Animated.Value(0)).current;
  const heartScale  = useRef(new Animated.Value(1)).current;
  const { color }   = STATUS_CONFIG[status];
  const strokeWidth = size * 0.072;

  const normalised = Math.min(Math.max((bpm - 30) / 150, 0), 1);

  useEffect(() => {
    Animated.spring(progress, {
      toValue:     normalised,
      useNativeDriver: false,
      tension:     40,
      friction:    8,
    }).start();
  }, [bpm]);

  // Heartbeat pulse
  useEffect(() => {
    if (bpm <= 0) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1,   duration: 150, useNativeDriver: true }),
      ]).start();
    }, (60 / Math.max(bpm, 1)) * 1000);
    return () => clearInterval(interval);
  }, [bpm]);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      {/* Track */}
      <View
        style={{
          position:     "absolute",
          width:        size,
          height:       size,
          borderRadius: size / 2,
          borderWidth:  strokeWidth,
          borderColor:  Colors.gray200,
        }}
      />
      {/* Progress arc */}
      <Animated.View
        style={{
          position:      "absolute",
          width:         size,
          height:        size,
          borderRadius:  size / 2,
          borderWidth:   strokeWidth,
          borderColor:   color,
          borderTopColor:   "transparent",
          borderRightColor: "transparent",
          transform: [{
            rotate: progress.interpolate({
              inputRange:  [0, 1],
              outputRange: ["-90deg", "270deg"],
            }),
          }],
          opacity: 0.9,
        }}
      />
      {/* Center */}
      <View style={{ alignItems: "center" }}>
        <Animated.Text
          style={{
            fontSize:      size * 0.26,
            fontWeight:    "800",
            color:         Colors.gray900,
            letterSpacing: -1,
            transform:     [{ scale: heartScale }],
          }}
        >
          {bpm > 0 ? bpm : "—"}
        </Animated.Text>
        <Text
          style={{
            fontSize:      size * 0.08,
            fontWeight:    "600",
            color:         Colors.gray400,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          BPM
        </Text>
      </View>
    </View>
  );
};