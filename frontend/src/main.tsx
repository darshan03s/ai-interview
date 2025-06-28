import { scan } from "react-scan";
scan({
  enabled: true,
});

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import "@/index.css";
import { ThemeProvider } from "@/features/theme";
import { AuthProvider } from "@/features/auth";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
