// 스켈레톤 로딩 플레이스홀더(펄스 애니메이션).

import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

import { colors } from "../theme";

export function Skeleton({ height = 16, width = "100%" as number | string, radius = 8 }: { height?: number; width?: number | string; radius?: number }) {
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={{ height, width: width as number, borderRadius: radius, backgroundColor: colors.border, opacity: o }} />;
}
