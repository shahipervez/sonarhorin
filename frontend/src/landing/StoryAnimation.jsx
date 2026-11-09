import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { useTrack } from "../track";
import { mmss } from "../utils";
import { CHORUS } from "./story/chorus";
import { clamp } from "./story/scenes";
import { SFX } from "./story/sfx";
import { STARTUP } from "./story/startup";
import { Voices } from "./story/voice";

const FADE = 0.35;
export const FILMS = { chorus: CHORUS, startup: STARTUP };

function Frame({ film, t }) {
  const last = film.scenes.length - 1;
  return (
    <>
      {film.scenes.map(([key, Comp, a, b], i) => {
        if (t < a - 0.01 || t > b + 0.01) return null;
        const op = i === last ? clamp((t - a) / FADE) : i === 0 ? clamp((b - t) / FADE) : clamp(Math.min((t - a) / FADE, (b - t) / FADE));
        return <g key={key} opacity={op}><Comp t={t} /></g>;
      })}
    </>
  );
}

/** A short animated film with subtitles, sound design and voices. Plays when scrolled into view. */
export function StoryPlayer({ film, autoplay = true, compact = false, onEnd }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [started, setStarted] = useState(false);
  const wrapRef = useRef(null);
  const tRef = useRef(0), playRef = useRef(false), userPaused = useRef(false);
  const sfx = useRef(null), voices = useRef(null);
  const DUR = film.DUR;
  const reduce = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => { voices.current = new Voices(film.id); return () => voices.current?.stop(); }, [film.id]);

  const inRain = (x) => film.rain && x > film.rain[0] && x < film.rain[1];
  const fire = useCallback((from, to) => {
    if (to <= from || to - from > 0.5) return;
    film.lines.forEach((l, i) => { if (l.a > from && l.a <= to) voices.current?.say(l, i, sfx.current); });
    if (!sfx.current) return;
    for (const [at, name, arg] of film.cues) {
      if (at > from && at <= to) {
        if (name === "pad") sfx.current.pad(arg);
        else if (name === "rain-on") sfx.current.rain(true);
        else if (name === "rain-off") sfx.current.rain(false);
        else sfx.current.play(name);
      }
    }
  }, [film]);

  const seek = useCallback((v) => {
    tRef.current = clamp(v, 0, DUR); setT(tRef.current);
    voices.current?.stop();
    if (sfx.current) sfx.current.rain(!!inRain(tRef.current) && playRef.current);
  }, [DUR]); // eslint-disable-line react-hooks/exhaustive-deps
  const play = useCallback(() => {
    if (tRef.current >= DUR) seek(0);
    playRef.current = true; setPlaying(true); setStarted(true);
  }, [seek, DUR]);
  const pause = useCallback(() => { playRef.current = false; setPlaying(false); sfx.current?.rain(false); voices.current?.stop(); }, []);

  useEffect(() => {
    let raf, last = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (!playRef.current) return;
      const prev = tRef.current, next = Math.min(DUR, prev + dt);
      fire(prev, next);
      tRef.current = next; setT(next);
      if (next >= DUR) { playRef.current = false; setPlaying(false); onEnd?.(); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fire, DUR, onEnd]);

  // reset when the film changes
  useEffect(() => { pause(); seek(0); setStarted(false); userPaused.current = false; }, [film.id, pause, seek]);

  useEffect(() => {
    if (reduce) { seek(film.poster ?? DUR - 3); return; }
    if (!autoplay) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.55 && !userPaused.current && tRef.current < DUR) play();
      else if (e.intersectionRatio < 0.2 && playRef.current) pause();
    }, { threshold: [0, 0.2, 0.55] });
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, [play, pause, seek, reduce, autoplay, film, DUR]);

  useEffect(() => () => { sfx.current?.close(); }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__story = { seek: (v) => { userPaused.current = true; pause(); seek(v); }, play };
  }, [seek, pause, play]);

  const toggleSound = () => {
    if (!sfx.current) { try { sfx.current = new SFX(); } catch { return; } }
    const on = !sound;
    if (!on) { sfx.current.out.gain.value = 0; sfx.current.rain(false); voices.current?.stop(); }
    else { sfx.current.ctx.resume(); sfx.current.out.gain.value = 0.55; if (inRain(tRef.current) && playRef.current) sfx.current.rain(true); }
    if (voices.current) voices.current.on = on;
    setSound(on);
  };
  const toggle = () => { if (playing) { userPaused.current = true; pause(); } else { userPaused.current = false; play(); } };

  const line = [...film.lines].reverse().find((l) => t >= l.a && t <= l.b);
  const chapter = [...film.chapters].reverse().find((c) => t >= c.t);
  const ended = t >= DUR - film.endHold;

  return (
    <div className={`story-player ${compact ? "compact" : ""}`} ref={wrapRef}>
      <div className="story-stage" onClick={() => !ended && toggle()}>
        <svg viewBox="0 0 1600 900" role="img" aria-label={film.aria}>
          <film.Defs />
          <Frame film={film} t={t} />
        </svg>
        {!started && !reduce && (
          <button className="story-big-play" onClick={(e) => { e.stopPropagation(); userPaused.current = false; if (!sound) toggleSound(); play(); }} aria-label="Play story">▶</button>
        )}
        {!sound && started && !ended && (
          <button className="story-sound-hint" onClick={(e) => { e.stopPropagation(); toggleSound(); }}>🔈 Tap for sound + voices</button>
        )}
        {ended && (
          <div className="story-end">
            <p className="bn">{film.end.bn}</p>
            <p className="en">{film.end.en}</p>
            <div className="row">
              <Link to={film.end.cta[0]} className="btn btn-lime">{film.end.cta[1]}</Link>
              <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); userPaused.current = false; seek(0); play(); }}>↺ Watch again</button>
            </div>
          </div>
        )}
      </div>
      <div className="story-caption" aria-live="polite">
        {line ? (
          <>
            {line.who && <span className="who">{line.who}</span>}
            <span className="bn only-bn">{line.bn}</span>
            <span className="en only-en">{line.en}</span>
          </>
        ) : <span className="en">&nbsp;</span>}
      </div>
      <div className="story-controls">
        <button className="ctl" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚" : t >= DUR ? "↺" : "▶"}</button>
        <span className="time">{mmss(t)} / {mmss(DUR)}</span>
        <div className="story-prog" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * DUR); }}>
          <i style={{ width: `${(t / DUR) * 100}%` }} />
          {film.chapters.map((c) => <b key={c.t} style={{ left: `${(c.t / DUR) * 100}%` }} />)}
        </div>
        <button className="ctl" onClick={toggleSound} aria-label={sound ? "Mute" : "Sound on"}>{sound ? "🔊" : "🔇"}</button>
      </div>
      {!compact && (
        <div className="story-chapters">
          {film.chapters.map((c, i) => (
            <button key={c.t} className={chapter === c ? "on" : ""} onClick={() => { userPaused.current = false; seek(c.t); play(); }}>
              <b>{i + 1}</b> <span className="bn only-bn">{c.bn}</span> <span className="en only-en">{c.en}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Scene 3 — the film. Job/Internship: “চাকরি পাইছো?” · Startup: Pulok's story. */
export default function StoryAnimation() {
  const [track] = useTrack();
  const film = FILMS[track === "startup" ? "startup" : "chorus"];
  const [lang] = useLang();
  const bn = lang === "bn";
  const startup = film.id === "startup";
  const eyebrow = bn ? film.eyebrow : startup ? "Pulok's story · 48 sec" : "Shuvo's story · 52 sec";
  const headline = !bn ? film.headline : startup ? <>বইয়ে মন বসতো না।<br /><em>আইডিয়ায় বসলো।</em></> : <>চায়ের দোকান, বাসা, রিকশা, ফোন —<br /><em>সবার একটাই প্রশ্ন।</em></>;
  return (
    <section className="story" id="story">
      <div className="wrap">
        <div className="story-head">
          <p className="eyebrow light">{eyebrow}</p>
          <h2 className={`h2 ${bn ? "bn-h" : ""}`}>{headline}</h2>
        </div>
        <StoryPlayer film={film} key={film.id} />
      </div>
    </section>
  );
}
