import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { ConfigProvider } from "./config";
import { initMonitoring } from "./integrations/monitoring";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "@fontsource/caveat/600.css";
import "@fontsource/galada/400.css";
import "./styles/landing.css";
import "./styles/app.css";
import "./styles/v3.css";
import "./styles/stories.css";
import "./styles/career.css";
import "./styles/login.css";
import "./styles/featured.css";
import "./styles/refresh.css";

initMonitoring(); // Sentry / PostHog / Plausible — each only if its VITE_* var is set

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ConfigProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </BrowserRouter>,
);
