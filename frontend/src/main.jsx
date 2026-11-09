import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { ConfigProvider } from "./config";
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

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ConfigProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </BrowserRouter>,
);
