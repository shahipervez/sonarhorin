import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

export const MAJORS = ["CSE", "EEE", "BBA", "English", "Pharmacy", "Textile", "Other"];
const DEFAULT = {
  discord_url: "https://discord.gg/your-invite-code",
  ai_enabled: false,
  quick_test: { questions: 10, minutes: 10, pass_percent: 70 },
  interview_minutes: 10,
};
const Ctx = createContext(DEFAULT);

export function ConfigProvider({ children }) {
  const [cfg, setCfg] = useState(DEFAULT);
  useEffect(() => { api("/api/config/").then((c) => setCfg({ ...DEFAULT, ...c })).catch(() => {}); }, []);
  return <Ctx.Provider value={cfg}>{children}</Ctx.Provider>;
}
export const useConfig = () => useContext(Ctx);
