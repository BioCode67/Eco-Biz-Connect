// 모바일 토스트 — 화면 하단에 잠시 떠오르는 알림.

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Kind = "success" | "error" | "info";
interface ToastCtx {
  show: (msg: string, kind?: Kind) => void;
}
const Ctx = createContext<ToastCtx | null>(null);

const DOT: Record<Kind, string> = { success: colors.leaf, error: colors.danger, info: colors.brand };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; kind: Kind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string, kind: Kind = "info") => {
      setToast({ msg, kind });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, 2600);
    },
    [opacity]
  );

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
          <View style={styles.toast}>
            <View style={[styles.dot, { backgroundColor: DOT[toast.kind] }]} />
            <Text style={styles.text}>{toast.msg}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  return useContext(Ctx) ?? { show: () => {} };
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", bottom: 90, left: 20, right: 20, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.text, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, maxWidth: 360 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  text: { color: "#fff", fontSize: 13.5, flexShrink: 1 },
});
