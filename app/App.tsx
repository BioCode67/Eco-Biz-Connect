import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Root from "./src/Root";
import { ToastProvider } from "./src/components/Toast";
import { AuthProvider } from "./src/lib/auth";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <Root />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
