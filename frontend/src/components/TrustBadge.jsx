import { useEffect, useId, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { toast } from "../utils";
import "../styles/trust-badge.css";

// Scam / fake-job signal from the backend detector (apps/jobs/trust.py). Bilingual; click/focus for the reasons.
const META = {
  verified: { ic: "✅", t: ["Verified", "যাচাইকৃত"], d: ["Partner employer, no red flags found.", "পার্টনার প্রতিষ্ঠান, কোনো সন্দেহজনক সংকেত নেই।"] },
  caution: { ic: "⚠️", t: ["Caution", "সতর্ক থাকুন"], d: ["Some warning signs — verify the employer before sharing anything.", "কিছু সতর্ক সংকেত আছে — কিছু দেওয়ার আগে প্রতিষ্ঠান যাচাই করুন।"] },
  danger: { ic: "🚫", t: ["Likely scam", "সম্ভাব্য প্রতারণা"], d: ["Strong scam signals. Never pay money to get a job.", "প্রতারণার জোরালো সংকেত। চাকরির জন্য কখনো টাকা দেবেন না।"] },
  ok: { ic: "🛡️", t: ["Report", "রিপোর্ট"], d: ["No red flags detected. Seen something off? Tell us.", "কোনো সন্দেহজনক সংকেত পাওয়া যায়নি। কিছু ভুল মনে হলে জানান।"] },
};
const REASONS = [
  ["asked_money", "Asked me to pay a fee / deposit", "ফি/জামানত চেয়েছে"],
  ["personal_info", "Asked for OTP / NID / bank info", "ওটিপি/এনআইডি/ব্যাংক তথ্য চেয়েছে"],
  ["chat_only", "Only WhatsApp / Telegram contact", "শুধু হোয়াটসঅ্যাপ/টেলিগ্রাম"],
  ["fake_company", "Company looks fake", "প্রতিষ্ঠান ভুয়া মনে হচ্ছে"],
  ["misleading", "Misleading salary / role", "বেতন/পদ বিভ্রান্তিকর"],
  ["other", "Other", "অন্যান্য"],
];

/** <TrustBadge job={j} L={0|1} compact? /> — renders nothing if the job has not been checked. */
export default function TrustBadge({ job, L = 0, compact = false }) {
  const { user } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("asked_money");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState(null); // server response after a report
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (!job) return null;
  const level = state?.trust_level || job.trust_level || "ok";
  const m = META[level] || META.ok;
  const reasons = state?.trust_reasons || job.trust_reasons || [];
  const stop = (e) => e.stopPropagation();

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api("/api/jobs/report-scam/", { method: "POST", body: { job_id: job.id, reason } });
      setState(r); setSent(true); setReport(false);
      toast(L ? "ধন্যবাদ! আমরা পোস্টটি যাচাই করব।" : "Thanks! We'll review this post.");
    } catch (e) {
      toast(e?.status === 429 ? (L ? "অনেক বেশি রিপোর্ট — পরে চেষ্টা করুন।" : "Too many reports — try later.")
        : (L ? "রিপোর্ট পাঠানো যায়নি।" : "Couldn't send the report."));
    } finally { setBusy(false); }
  };

  return (
    <span className={`tb tb-${level} ${compact ? "tb-compact" : ""}`} ref={ref} onClick={stop} onPointerDown={stop}>
      <button type="button" className="tb-btn" aria-expanded={open} aria-controls={id}
              title={`${m.t[L]} — ${m.d[L]}`} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">{m.ic}</span>
        {(!compact || level !== "ok") && <span className="tb-t">{m.t[L]}</span>}
      </button>
      {open && (
        <span className="tb-pop" id={id} role="dialog" aria-label={m.t[L]}>
          <b className="tb-h">{m.ic} {m.t[L]}{typeof job.trust_score === "number" && level !== "ok" && <em>{L ? "ট্রাস্ট স্কোর" : "Trust"} {state?.trust_score ?? job.trust_score}/100</em>}</b>
          <span className="tb-d">{m.d[L]}</span>
          {reasons.length > 0 && (
            <ul>{reasons.slice(0, 6).map((r, i) => <li key={r.code + i}>{(L ? r.bn : r.en) || r.en}</li>)}</ul>
          )}
          <span className="tb-tip">{L ? "💡 আসল নিয়োগকর্তা কখনো রেজিস্ট্রেশন ফি, জামানত বা বিকাশে টাকা চায় না।"
            : "💡 Real employers never ask for a registration fee, deposit or bKash payment."}</span>
          {sent ? (
            <span className="tb-done">✓ {L ? "রিপোর্ট পাঠানো হয়েছে" : "Reported"}</span>
          ) : !user ? (
            <span className="tb-muted">{L ? "রিপোর্ট করতে লগইন করুন।" : "Log in to report this post."}</span>
          ) : report ? (
            <span className="tb-form">
              <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label={L ? "কারণ" : "Reason"}>
                {REASONS.map(([v, en, bn]) => <option key={v} value={v}>{L ? bn : en}</option>)}
              </select>
              <button type="button" className="tb-send" disabled={busy} onClick={submit}>{L ? "পাঠান" : "Send"}</button>
            </span>
          ) : (
            <button type="button" className="tb-report" onClick={() => setReport(true)}>🚩 {L ? "প্রতারণা রিপোর্ট করুন" : "Report as scam"}</button>
          )}
        </span>
      )}
    </span>
  );
}
