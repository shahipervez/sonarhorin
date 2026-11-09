import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import Scribble from "../components/Scribble";
import { toast } from "../utils";

const hue = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const Av = ({ p, size = 40 }) => <span className="nav-av" style={{ width: size, height: size, background: `hsl(${hue(p.full_name || p.name)} 55% 45%)` }}>{p.initials || (p.full_name || p.name || "?").slice(0, 2).toUpperCase()}</span>;
const when = (d) => { const t = new Date(d); const diff = (Date.now() - t) / 60000; return diff < 1 ? "now" : diff < 60 ? `${Math.floor(diff)}m` : diff < 1440 ? t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : t.toLocaleDateString(); };

/** Page 2 · Network — connect with people from your university and major, chat 1:1 or in rooms. */
export default function Network() {
  const [ov, setOv] = useState(null);
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("chats");
  const [chat, setChat] = useState(null);      // { kind: "dm"|"room", id, title, sub }
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [mView, setMView] = useState("list");  // mobile: list | chat | people
  const lastId = useRef(0);
  const box = useRef(null);

  const loadOv = useCallback(() => api("/api/network/").then(setOv).catch(() => {}), []);
  useEffect(() => { loadOv(); const id = setInterval(loadOv, 15000); return () => clearInterval(id); }, [loadOv]);
  useEffect(() => { const id = setTimeout(() => api(`/api/network/people/${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setPeople).catch(() => {}), 250); return () => clearTimeout(id); }, [q]);
  useEffect(() => { if (ov && !chat) setChat({ kind: "room", id: "general", title: "সবাই · Everyone", sub: "Job leads, questions, wins" }); }, [ov, chat]);

  const path = chat && (chat.kind === "dm" ? `/api/network/dm/${chat.id}/` : `/api/network/rooms/${chat.id}/`);
  useEffect(() => {
    if (!path) return;
    let alive = true; lastId.current = 0; setMsgs([]);
    const pull = async (first) => {
      try {
        const r = await api(first ? path : `${path}?after=${lastId.current}`);
        if (!alive) return;
        if (r.messages.length) { lastId.current = r.messages[r.messages.length - 1].id; setMsgs((m) => (first ? r.messages : [...m, ...r.messages])); }
      } catch { /* offline */ }
    };
    pull(true);
    const id = setInterval(() => pull(false), 3000);
    return () => { alive = false; clearInterval(id); };
  }, [path]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs.length]);

  const send = async (e) => {
    e.preventDefault(); const t = text.trim(); if (!t) return;
    setText("");
    try { const m = await api(path, { method: "POST", body: { text: t } }); lastId.current = Math.max(lastId.current, m.id); setMsgs((x) => [...x, m]); }
    catch (x) { toast(x.message); setText(t); }
  };
  const connect = async (p) => {
    try { const r = await api(`/api/network/connect/${p.id}/`, { method: "POST", body: {} }); setPeople((ps) => ps.map((x) => (x.id === p.id ? { ...x, state: r.state } : x))); loadOv(); toast(r.state === "connected" ? `Connected with ${p.full_name}` : "Request sent"); }
    catch (x) { toast(x.message); }
  };
  const respond = async (r, action) => { await api(`/api/network/requests/${r.request_id}/${action}/`, { method: "POST" }); loadOv(); if (action === "accept") toast(`You and ${r.full_name} are connected`); };
  const openDm = (p) => { setChat({ kind: "dm", id: p.id, title: p.full_name, sub: [p.major, p.university].filter(Boolean).join(" · ") }); setMView("chat"); };
  const openRoom = (r) => { setChat({ kind: "room", id: r.slug, title: r.name, sub: r.desc }); setMView("chat"); };

  if (!ov) return <div className="page"><div className="wrap"><p className="muted">Loading your network…</p></div></div>;
  const reqCount = ov.incoming.length;

  return (
    <div className="page net-page">
      <div className="wrap">
        <div className="net-head">
          <div><p className="eyebrow">পেজ ২ · নেটওয়ার্ক</p><h1 className="h2">Your <em>network.</em></h1>
            <p className="muted lead2">Chat with people from your university and major — referrals, interview stories, job leads.</p></div>
          <div className="net-stats"><b>{ov.connections}</b><span>connections</span>{ov.unread > 0 && <><b className="u">{ov.unread}</b><span>unread</span></>}</div>
        </div>
        <div className="net-mtabs">{[["list", "Chats"], ["chat", "Conversation"], ["people", "People"]].map(([k, l]) => <button key={k} className={mView === k ? "on" : ""} onClick={() => setMView(k)}>{l}</button>)}</div>

        <div className={`net-grid m-${mView}`}>
          <aside className="net-left">
            <div className="net-tabs">
              {[["chats", "Chats", ov.unread], ["rooms", "Rooms"], ["requests", "Requests", reqCount]].map(([k, l, n]) => (
                <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}{n ? <em>{n}</em> : null}</button>
              ))}
            </div>
            {tab === "chats" && (ov.threads.length ? ov.threads.map((t) => (
              <button key={t.id} className={`net-row ${chat?.kind === "dm" && chat.id === t.id ? "on" : ""}`} onClick={() => openDm(t)}>
                <Av p={t} /><span className="tx"><b>{t.full_name}</b><small>{t.last || `${t.major} · ${t.university || "—"}`}</small></span>
                {t.unread > 0 && <em className="badge">{t.unread}</em>}
              </button>
            )) : <p className="net-empty">No connections yet — connect with someone on the right, then chat here.</p>)}
            {tab === "rooms" && ov.rooms.map((r) => (
              <button key={r.slug} className={`net-row ${chat?.kind === "room" && chat.id === r.slug ? "on" : ""}`} onClick={() => openRoom(r)}>
                <span className="room-ic">#</span><span className="tx"><b className="bn">{r.name}{r.mine && <i className="for-you">for you</i>}</b><small>{r.last || r.desc}</small></span>
              </button>
            ))}
            {tab === "requests" && (
              <>
                {ov.incoming.map((r) => (
                  <div key={r.request_id} className="net-req"><Av p={r} /><span className="tx"><b>{r.full_name}</b><small>{r.major} · {r.university}</small>{r.note && <q>{r.note}</q>}</span>
                    <span className="acts"><button className="btn btn-lime sm" onClick={() => respond(r, "accept")}>Accept</button><button className="link small" onClick={() => respond(r, "decline")}>Ignore</button></span></div>
                ))}
                {ov.outgoing.map((r) => <div key={r.request_id} className="net-req out"><Av p={r} /><span className="tx"><b>{r.full_name}</b><small>Request sent</small></span></div>)}
                {!ov.incoming.length && !ov.outgoing.length && <p className="net-empty">No requests right now.</p>}
              </>
            )}
          </aside>

          <section className="net-chat">
            {chat && (
              <>
                <header><span className={chat.kind === "room" ? "room-ic" : ""}>{chat.kind === "room" ? "#" : <Av p={{ full_name: chat.title }} size={36} />}</span>
                  <div><b className="bn">{chat.title}</b><small>{chat.sub}</small></div></header>
                <div className="net-msgs" ref={box}>
                  {!msgs.length && <p className="net-empty center">Say hi 👋 — be the first message here.</p>}
                  {msgs.map((m, i) => {
                    const showName = chat.kind === "room" && !m.mine && (i === 0 || msgs[i - 1].sender.id !== m.sender.id);
                    return (
                      <div key={m.id} className={`msg ${m.mine ? "me" : ""}`}>
                        {showName && <span className="who">{m.sender.full_name} · {m.sender.major}</span>}
                        <p>{m.text}</p><time>{when(m.created_at)}</time>
                      </div>
                    );
                  })}
                </div>
                <form className="net-compose" onSubmit={send}>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder={chat.kind === "room" ? `Message #${chat.id}…` : `Message ${chat.title.split(" ")[0]}…`} maxLength={2000} />
                  <button className="btn btn-ink sm" disabled={!text.trim()}>Send</button>
                </form>
              </>
            )}
          </section>

          <aside className="net-right">
            <Scribble className="net-note" text="তোমার ভার্সিটির মানুষ আগে" arrow="down" />
            <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, university, major…" />
            <div className="net-people">
              {people.map((p) => (
                <div key={p.id} className="person">
                  <Av p={p} size={44} />
                  <span className="tx"><b>{p.full_name}</b><small>{p.major} · {p.university || "—"}{p.graduation_year ? ` '${String(p.graduation_year).slice(2)}` : ""}</small>{p.headline && <em>{p.headline}</em>}</span>
                  {p.state === "connected" ? <button className="btn btn-out sm" onClick={() => openDm(p)}>Message</button>
                    : p.state === "outgoing" ? <span className="small muted">Sent</span>
                    : p.state === "incoming" ? <button className="btn btn-lime sm" onClick={() => connect(p)}>Accept</button>
                    : <button className="btn btn-ink sm" onClick={() => connect(p)}>+ Connect</button>}
                </div>
              ))}
              {!people.length && <p className="net-empty">No one found.</p>}
            </div>
            <p className="small muted net-safe">🔒 Never share your NID, bank card or OTP in chat. Anyone asking for money for a job is a scammer.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
