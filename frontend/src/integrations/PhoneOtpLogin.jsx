import { useEffect, useState } from "react";
import { useAuth } from "../auth";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toLatin = (s) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** Client-side check only (the server normalises again): 01XXXXXXXXX, 8801…, +8801… */
export function looksLikeBdMobile(raw) {
  let s = toLatin(String(raw || "")).replace(/[\s\-().]/g, "").replace(/^\+/, "").replace(/^00/, "");
  if (s.startsWith("880")) s = s.slice(2);
  return /^01[3-9]\d{8}$/.test(s);
}

/**
 * Password-less "Login with phone": number → 6-digit SMS code → session. Bangla + English.
 * Styled with the Login page's forest-* classes; pass onSuccess(user).
 */
export default function PhoneOtpLogin({ L = 0, onSuccess, onError }) {
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState("phone"); // phone | code
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e) => {
    e?.preventDefault();
    if (!looksLikeBdMobile(phone)) {
      setErr(L ? "সঠিক মোবাইল নম্বর দাও (01XXXXXXXXX)।" : "Enter a valid mobile number (01XXXXXXXXX).");
      return;
    }
    setBusy(true); setErr(""); setInfo("");
    try {
      const d = await requestOtp(toLatin(phone));
      setStep("code");
      setWait(d.resend_in || 60);
      setInfo(L ? `${d.phone} নম্বরে ৬ সংখ্যার কোড পাঠানো হয়েছে।` : `We sent a 6-digit code to ${d.phone}.`);
    } catch (x) {
      if (x.status === 429 && x.data?.retry_after) { setWait(x.data.retry_after); setStep("code"); }
      setErr(x.status === 429 && !x.data?.retry_after ? (L ? "অনেকবার চেষ্টা হয়েছে, পরে আবার চেষ্টা করো।" : "Too many requests — please try again later.") : x.message);
    }
    setBusy(false);
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const user = await verifyOtp(toLatin(phone), toLatin(code).trim(), name.trim());
      onSuccess?.(user);
      return;
    } catch (x) {
      const left = x.data?.attempts_left;
      setErr(left != null ? `${x.message} ${L ? `আর ${left} বার চেষ্টা করা যাবে।` : `${left} attempt(s) left.`}` : x.message);
      if (x.data?.code === "expired" || x.data?.code === "locked") { setCode(""); }
      onError?.(x);
    }
    setBusy(false);
  };

  return (
    <div className="forest-otp" onSubmit={(e) => e.stopPropagation()}>
      {step === "phone" ? (
        <div className="forest-inputs-stack">
          <div className="forest-field-group">
            <label className="forest-field-label" htmlFor="otp-phone">{L ? "মোবাইল নম্বর" : "Mobile number"}</label>
            <div className="forest-input-wrap">
              <input id="otp-phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="01XXXXXXXXX"
                     className="forest-line-input" value={phone} onChange={(e) => setPhone(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && send(e)} />
              <span className="forest-input-icon">📱</span>
            </div>
          </div>
          <small className="muted">{L ? "পাসওয়ার্ড লাগবে না — SMS-এ একটি কোড যাবে।" : "No password needed — we'll text you a code."}</small>
        </div>
      ) : (
        <div className="forest-inputs-stack">
          <div className="forest-field-group">
            <label className="forest-field-label" htmlFor="otp-code">{L ? "৬ সংখ্যার কোড" : "6-digit code"}</label>
            <div className="forest-input-wrap">
              <input id="otp-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required
                     placeholder="••••••" className="forest-line-input" value={code}
                     onChange={(e) => setCode(toLatin(e.target.value).replace(/\D/g, "").slice(0, 6))}
                     onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify(e)} />
              <span className="forest-input-icon">🔑</span>
            </div>
          </div>
          <div className="forest-field-group">
            <label className="forest-field-label" htmlFor="otp-name">{L ? "তোমার নাম (নতুন অ্যাকাউন্ট হলে)" : "Your name (for a new account)"}</label>
            <div className="forest-input-wrap">
              <input id="otp-name" type="text" autoComplete="name" className="forest-line-input" value={name}
                     onChange={(e) => setName(e.target.value)} placeholder={L ? "ঐচ্ছিক" : "Optional"} />
            </div>
          </div>
          {info && <small className="muted">{info}</small>}
        </div>
      )}

      {err && <div className="forest-err-box"><span>⚠️ {err}</span></div>}

      {step === "phone" ? (
        <button type="button" className="forest-submit-btn" disabled={busy} onClick={send}>
          {busy ? (L ? "পাঠানো হচ্ছে…" : "Sending…") : L ? "কোড পাঠাও" : "Send code"}
        </button>
      ) : (
        <>
          <button type="button" className="forest-submit-btn" disabled={busy || code.length !== 6} onClick={verify}>
            {busy ? (L ? "যাচাই হচ্ছে…" : "Verifying…") : L ? "যাচাই করে লগইন" : "Verify & login"}
          </button>
          <div className="forest-options-row">
            <button type="button" className="forest-forgot-link" style={{ background: "none", border: 0, cursor: "pointer" }}
                    onClick={() => { setStep("phone"); setCode(""); setErr(""); setInfo(""); }}>
              {L ? "← নম্বর বদলাও" : "← Change number"}
            </button>
            <button type="button" className="forest-forgot-link" style={{ background: "none", border: 0, cursor: wait > 0 ? "default" : "pointer" }}
                    disabled={wait > 0 || busy} onClick={send}>
              {wait > 0 ? (L ? `আবার পাঠাও (${wait}s)` : `Resend in ${wait}s`) : L ? "আবার কোড পাঠাও" : "Resend code"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
