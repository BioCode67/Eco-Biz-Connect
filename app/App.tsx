import React from "react";

import Root from "./src/Root";
import { AuthProvider } from "./src/lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
