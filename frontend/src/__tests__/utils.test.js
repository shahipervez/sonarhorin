import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fmt, mmss, pickVoice, speak, toast } from "../utils";

describe("fmt", () => {
  it("groups thousands with en-US separators", () => {
    expect(fmt(1234567)).toBe("1,234,567");
    expect(fmt(0)).toBe("0");
  });
  it("coerces numeric strings", () => {
    expect(fmt("25000")).toBe("25,000");
  });
});

describe("mmss", () => {
  it("formats seconds as m:ss", () => {
    expect(mmss(0)).toBe("0:00");
    expect(mmss(5)).toBe("0:05");
    expect(mmss(65)).toBe("1:05");
    expect(mmss(600)).toBe("10:00");
  });
  it("drops fractional seconds", () => {
    expect(mmss(59.9)).toBe("0:59");
  });
});

describe("toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.getElementById("toast")?.remove();
  });

  it("creates a single #toast element, shows the message, hides it after 3s", () => {
    toast("Saved!");
    const el = document.getElementById("toast");
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("Saved!");
    expect(el).toHaveClass("toast", "on");

    toast("Again");
    expect(document.querySelectorAll("#toast")).toHaveLength(1);
    expect(el).toHaveTextContent("Again");

    vi.advanceTimersByTime(2999);
    expect(el).toHaveClass("on");
    vi.advanceTimersByTime(2);
    expect(el).not.toHaveClass("on");
  });

  it("restarts the hide timer on each call", () => {
    toast("one");
    vi.advanceTimersByTime(2000);
    toast("two");
    vi.advanceTimersByTime(2000);
    expect(document.getElementById("toast")).toHaveClass("on");
    vi.advanceTimersByTime(1001);
    expect(document.getElementById("toast")).not.toHaveClass("on");
  });
});

describe("pickVoice / speak", () => {
  const voices = [
    { name: "Google Deutsch", lang: "de-DE" },
    { name: "Daniel", lang: "en-GB" },
    { name: "Microsoft Zira", lang: "en-US" },
    { name: "Bangla Voice", lang: "bn-BD" },
  ];
  let orig;
  beforeEach(() => {
    orig = window.speechSynthesis;
  });
  afterEach(() => {
    window.speechSynthesis = orig;
    vi.useRealTimers();
  });

  it("returns null when speechSynthesis is unavailable", () => {
    window.speechSynthesis = undefined;
    expect(pickVoice("en")).toBeNull();
  });

  it("prefers a female/natural English voice", () => {
    window.speechSynthesis = { getVoices: () => voices };
    expect(pickVoice("en").name).toBe("Microsoft Zira");
  });

  it("falls back to en-IN/en-GB, then any voice of the language", () => {
    window.speechSynthesis = { getVoices: () => voices.filter((v) => v.name !== "Microsoft Zira") };
    expect(pickVoice("en").name).toBe("Daniel");
    window.speechSynthesis = { getVoices: () => [{ name: "Fred", lang: "en-US" }] };
    expect(pickVoice("en").name).toBe("Fred");
  });

  it("picks a Bangla voice for bn", () => {
    window.speechSynthesis = { getVoices: () => voices };
    expect(pickVoice("bn").lang).toBe("bn-BD");
  });

  it("speak() without a voice still calls onend after a reading-time delay", () => {
    vi.useFakeTimers();
    window.speechSynthesis = undefined;
    const onend = vi.fn();
    expect(speak("hello there friend", { onend })).toBeNull();
    vi.advanceTimersByTime(1799);
    expect(onend).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onend).toHaveBeenCalledOnce();
  });

  it("speak() with a voice cancels and speaks an utterance", () => {
    const synth = { getVoices: () => voices, cancel: vi.fn(), speak: vi.fn() };
    window.speechSynthesis = synth;
    const Utt = vi.fn(function (text) { this.text = text; });
    vi.stubGlobal("SpeechSynthesisUtterance", Utt);
    const onend = vi.fn();
    const u = speak("Hi", { onend, rate: 1.2 });
    expect(synth.cancel).toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledWith(u);
    expect(u.voice.name).toBe("Microsoft Zira");
    expect(u.rate).toBe(1.2);
    u.onend();
    expect(onend).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
