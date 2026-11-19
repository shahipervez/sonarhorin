import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth";
import { loadScript } from "./loadScript";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const googleEnabled = Boolean(CLIENT_ID);

/**
 * "Continue with Google" (Google Identity Services). Renders nothing — and loads nothing — unless
 * VITE_GOOGLE_CLIENT_ID is set. Calls onSuccess(user) after the backend has issued our own JWT session.
 */
export default function GoogleButton({ onSuccess, onError, L = 0, text = "continue_with" }) {
  const { loginWithGoogle } = useAuth();
  const box = useRef(null);
  const cb = useRef({});
  cb.current = { onSuccess, onError, loginWithGoogle };
  const [state, setState] = useState("loading"); // loading | ready | busy | failed

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let alive = true;
    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        if (!alive || !window.google?.accounts?.id || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          use_fedcm_for_prompt: true,
          callback: async ({ credential }) => {
            setState("busy");
            try {
              const user = await cb.current.loginWithGoogle(credential);
              cb.current.onSuccess?.(user);
            } catch (e) {
              cb.current.onError?.(e);
            }
            if (alive) setState("ready");
          },
        });
        window.google.accounts.id.renderButton(box.current, {
          type: "standard", theme: "outline", size: "large", shape: "pill", text,
          locale: L ? "bn" : "en", width: Math.min(box.current.offsetWidth || 320, 400),
        });
        setState("ready");
      })
      .catch(() => alive && setState("failed"));
    return () => { alive = false; };
  }, [L, text]);

  if (!CLIENT_ID) return null;
  return (
    <div className="oauth-google" style={{ display: "grid", justifyItems: "center", gap: 6, margin: "12px 0" }}>
      <div ref={box} style={{ width: "100%", maxWidth: 400, display: "flex", justifyContent: "center", minHeight: 44 }} />
      {state === "busy" && <small className="muted">{L ? "গুগল দিয়ে ঢুকছি…" : "Signing in with Google…"}</small>}
      {state === "failed" && <small className="muted">{L ? "গুগল লগইন লোড হয়নি — ইন্টারনেট চেক করো।" : "Google sign-in couldn't load — check your connection."}</small>}
    </div>
  );
}
