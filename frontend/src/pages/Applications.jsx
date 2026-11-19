import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { api } from "../api";
import { useAuth } from "../auth";
import { useLang } from "../i18n";
import { fmt, toast } from "../utils";
import { CompanyLogo, getCH } from "./Jobs";
import "../styles/kanban.css";

/**
 * /applications — application tracker as a Kanban board.
 *
 * A card's column = its `candidate_stage` (the applicant's own Kanban stage, set with
 * PATCH /api/jobs/applications/<id>/stage/ {candidate_stage}) — or, when that is empty, a column derived
 * from the employer-side `status`. Dragging a "To finish" (needs_action) card into "Applied" also calls the
 * real `done` action. If the stage endpoint is missing (older backend → 404/405) the move is kept as a
 * per-user localStorage note instead, until the server status changes.
 */
const COLS = [
  { id: "todo", ic: "📝", en: "To finish", bn: "শেষ করা বাকি", stage: null, stages: [], statuses: ["needs_action"] },
  { id: "applied", ic: "📨", en: "Applied", bn: "আবেদন করেছি", stage: "applied", stages: ["applied"], statuses: ["submitted", "sent", "done"] },
  { id: "screening", ic: "🔎", en: "Shortlisted / Test", bn: "শর্টলিস্ট / টেস্ট", stage: "screening", stages: ["screening"], statuses: ["shortlisted"] },
  { id: "interview", ic: "🎤", en: "Interview", bn: "ইন্টারভিউ", stage: "interview", stages: ["interview"], statuses: ["interview"] },
  { id: "offer", ic: "🎉", en: "Offer / Hired", bn: "অফার / চাকরি", stage: "offer", stages: ["offer", "hired"], statuses: ["hired"] },
  { id: "closed", ic: "🗂", en: "Rejected / Closed", bn: "বাদ / বন্ধ", stage: "rejected", stages: ["rejected", "archived"], statuses: ["rejected", "withdrawn", "failed"] },
];
const colOf = (status) => (COLS.find((c) => c.statuses.includes(status)) || COLS[1]).id;
const colOfStage = (stage) => COLS.find((c) => c.stages.includes(stage))?.id;

// the column under the pointer wins; fall back to overlap for keyboard drags
const collide = (args) => { const hit = pointerWithin(args); return hit.length ? hit : rectIntersection(args); };

const stageKey = (uid) => `sh_app_stage_${uid || "me"}`;
const readStages = (uid) => { try { return JSON.parse(localStorage.getItem(stageKey(uid)) || "{}") || {}; } catch { return {}; } };
const writeStages = (uid, m) => { try { localStorage.setItem(stageKey(uid), JSON.stringify(m)); } catch { /* private mode */ } };

export default function Applications() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [view, setView] = useState(null);
  const [stages, setStages] = useState(() => readStages(user?.id));
  const [dragId, setDragId] = useState(null);
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const CH = getCH(L);

  const load = () =>
    api("/api/jobs/applications/")
      .then(setD)
      .catch(() => setD({ applications: [], counts: {} }));

  useEffect(() => { load(); }, []);
  useEffect(() => { setStages(readStages(user?.id)); }, [user?.id]);

  const act = async (id, action) => {
    try {
      await api(`/api/jobs/applications/${id}/${action}/`, { method: "POST" });
    } catch (e) {
      toast(e?.message || (L ? "হয়নি, আবার চেষ্টা করো" : "Could not update — try again"));
    }
    return load();
  };

  const apps = d?.applications || [];
  const total = apps.length;

  // effective column: the user's own stage note, unless the server status moved on since it was set
  const colFor = (a) => {
    const o = stages[a.id];
    if (o && o.status === a.status) return o.col; // local fallback (no stage endpoint)
    return colOfStage(a.candidate_stage) || colOf(a.status);
  };
  const byCol = useMemo(() => {
    const m = Object.fromEntries(COLS.map((c) => [c.id, []]));
    apps.forEach((a) => m[colFor(a)].push(a));
    return m;
  }, [apps, stages]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStage = (a, col) => {
    const next = { ...stages };
    if (col === colOf(a.status)) delete next[a.id];
    else next[a.id] = { col, status: a.status, at: Date.now() };
    setStages(next);
    writeStages(user?.id, next);
  };

  const move = async (a, col) => {
    if (!a || colFor(a) === col) return;
    if (a.status === "needs_action" && col === "applied") {
      // the one move the backend knows about: "I finished on the portal"
      const cleared = { ...stages };
      delete cleared[a.id];
      setStages(cleared);
      writeStages(user?.id, cleared);
      await act(a.id, "done");
      toast(L ? "সাবমিট হিসেবে চিহ্নিত ✓" : "Marked as submitted ✓");
      return;
    }
    const stage = COLS.find((c) => c.id === col)?.stage ?? null;
    // optimistic: move the card now, then save on the server
    setD((o) => o && { ...o, applications: o.applications.map((x) => (x.id === a.id ? { ...x, candidate_stage: stage } : x)) });
    try {
      const saved = await api(`/api/jobs/applications/${a.id}/stage/`, { method: "PATCH", body: { candidate_stage: stage } });
      if (stages[a.id]) { const n = { ...stages }; delete n[a.id]; setStages(n); writeStages(user?.id, n); }
      if (saved && saved.id) setD((o) => o && { ...o, applications: o.applications.map((x) => (x.id === a.id ? { ...x, ...saved } : x)) });
    } catch (e) {
      if (e?.status === 404 || e?.status === 405) setStage(a, col); // older backend: keep it on this device
      else { toast(e?.message || (L ? "সেভ হয়নি, আবার চেষ্টা করো" : "Could not save — try again")); load(); }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const dragged = apps.find((a) => String(a.id) === dragId);

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">{L ? "আমার আবেদনসমূহ" : "My applications"}</p>
            <h1 className="h2">
              {total ? (
                L ? <>মোট {fmt(total)}টি আবেদন <em>চলমান।</em></> : <>{fmt(total)} applications <em>out there.</em></>
              ) : L ? "এখনও কোনো আবেদন করা হয়নি।" : "No applications yet."}
            </h1>
            <p className="muted lead2">
              {L
                ? "কার্ড টেনে নিজের ধাপে রাখো — আবেদন, ইন্টারভিউ, অফার। ১-ক্লিক, ইমেইল বা পোর্টাল — সব এক বোর্ডে।"
                : "Drag each card to where you are — applied, interview, offer. 1-click, email or portal, all on one board."}
            </p>
          </div>
          <Link to="/jobs" className="btn btn-ink">{L ? "আরও চাকরি ব্রাউজ করো →" : "Find more jobs →"}</Link>
        </div>

        {d && total === 0 && (
          <div className="card share-cta">
            <p className="muted">{L ? "তোমার প্রথম ফ্রেশার চাকরিতে আবেদন করো — মাত্র এক ক্লিকেই।" : "Apply to your first fresher job — it takes one tap."}</p>
            <Link className="btn btn-ink" to="/jobs">{L ? "চাকরি ব্রাউজ করো" : "Browse jobs"}</Link>
          </div>
        )}
        {!d && <p className="muted">{L ? "লোড হচ্ছে…" : "Loading…"}</p>}

        {total > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={collide}
            onDragStart={(e) => setDragId(String(e.active.id))}
            onDragCancel={() => setDragId(null)}
            onDragEnd={(e) => {
              setDragId(null);
              if (e.over) move(apps.find((a) => String(a.id) === String(e.active.id)), String(e.over.id));
            }}
          >
            <div className="kb" role="list">
              {COLS.map((c) => (
                <Column key={c.id} c={c} L={L} count={byCol[c.id].length}>
                  {byCol[c.id].map((a) => (
                    <Card key={a.id} a={a} L={L} CH={CH} col={c.id} own={(!!stages[a.id] && stages[a.id].status === a.status) || !!a.candidate_stage}
                      onMove={(col) => move(a, col)} onAct={act} onLetter={() => setView(a)} hidden={String(a.id) === dragId} />
                  ))}
                </Column>
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {dragged ? <CardBody a={dragged} L={L} CH={CH} overlay /> : null}
            </DragOverlay>
          </DndContext>
        )}
        {total > 0 && (
          <p className="muted small kb-note">
            {L
              ? "ⓘ ✋ চিহ্ন মানে ধাপটা তুমি নিজে ঠিক করেছ — কোম্পানির স্ট্যাটাস কার্ডে আলাদা দেখানো থাকে।"
              : "ⓘ ✋ means you set that stage yourself — the employer's status is still shown on the card."}
          </p>
        )}

        {view && (
          <div className="modal-bg" onClick={() => setView(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-x" onClick={() => setView(null)} aria-label="Close">✕</button>
              <h2 className="h3">{L ? `কভার লেটার — ${view.job.title}` : `Cover letter — ${view.job.title}`}</h2>
              <pre className="letter">{view.cover_letter}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ c, L, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: c.id });
  return (
    <section ref={setNodeRef} className={`kb-col kb-${c.id} ${isOver ? "over" : ""}`} role="listitem" aria-label={L ? c.bn : c.en}>
      <header className="kb-head">
        <span>{c.ic} <b className={L ? "bn" : ""}>{L ? c.bn : c.en}</b></span>
        <i>{fmt(count)}</i>
      </header>
      <div className="kb-cards">
        {children}
        {!count && <p className="kb-empty">{L ? "এখানে টেনে আনো" : "Drop a card here"}</p>}
      </div>
    </section>
  );
}

function CardBody({ a, L, CH, overlay, own }) {
  return (
    <div className={`kb-card ${overlay ? "overlay" : ""}`}>
      <div className="kb-top">
        <CompanyLogo company={a.job.company} />
        <div className="kb-main">
          <Link to={`/jobs/${a.job.id}`} className="kb-title" onPointerDown={(e) => e.stopPropagation()}>{a.job.title}</Link>
          <span>{a.job.company.name}</span>
        </div>
      </div>
      <div className="kb-meta">
        <span className={`chbadge ${CH[a.channel]?.cls || ""}`}>{CH[a.channel]?.ic} {CH[a.channel]?.t}</span>
        <span className={`status s-${a.status}`}>{a.status_label}</span>
        {own && <span className="kb-own" title={L ? "তুমি নিজে সরিয়েছ" : "Moved by you"}>✋ {L ? "আমার ধাপ" : "my stage"}</span>}
        {a.auto && <em className="autotag">🤖 auto</em>}
      </div>
      <small className="muted">{new Date(a.created_at).toLocaleDateString(L ? "bn-BD" : "en-GB")}</small>
    </div>
  );
}

function Card({ a, L, CH, col, own, onMove, onAct, onLetter, hidden }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: String(a.id) });
  const stop = { onPointerDown: (e) => e.stopPropagation(), onKeyDown: (e) => e.stopPropagation() };
  return (
    <div ref={setNodeRef} className={`kb-drag ${hidden ? "ghost" : ""}`} {...listeners} {...attributes}
      aria-roledescription={L ? "টেনে সরানো যায় এমন কার্ড" : "draggable card"}>
      <CardBody a={a} L={L} CH={CH} own={own} />
      <div className="kb-act" {...stop}>
        {a.status === "needs_action" && (
          <>
            <a className="btn btn-out sm" href={a.job.apply_url} target="_blank" rel="noopener noreferrer">{L ? "পোর্টাল ↗" : "Portal ↗"}</a>
            <button className="btn btn-lime sm" onClick={() => onAct(a.id, "done")}>{L ? "সাবমিট করেছি ✓" : "Mark submitted ✓"}</button>
          </>
        )}
        <button className="link small" onClick={onLetter}>{L ? "কভার লেটার" : "Letter"}</button>
        {["needs_action", "submitted", "sent", "done"].includes(a.status) && (
          <button className="link small" onClick={() => { if (confirm(L ? "আবেদনটি প্রত্যাহার করবে?" : "Withdraw this application?")) onAct(a.id, "withdraw"); }}>
            {L ? "প্রত্যাহার" : "Withdraw"}
          </button>
        )}
        <label className="kb-moveto">
          <span className="sr-only">{L ? "ধাপ বদলাও" : "Move to"}</span>
          <select value={col} onChange={(e) => onMove(e.target.value)} aria-label={L ? "ধাপ বদলাও" : "Move to stage"}>
            {COLS.map((c) => <option key={c.id} value={c.id}>{c.ic} {L ? c.bn : c.en}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
