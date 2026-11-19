import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { setLang, useLang, useT } from "../i18n";

afterEach(() => act(() => setLang("en")));

describe("setLang", () => {
  it("stores the language and updates <html lang> + data-lang", () => {
    setLang("bn");
    expect(localStorage.getItem("prothom_lang")).toBe("bn");
    expect(document.documentElement.lang).toBe("bn");
    expect(document.documentElement.dataset.lang).toBe("bn");
    setLang("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

describe("useLang", () => {
  it("reads English by default and ignores junk values", () => {
    localStorage.setItem("prothom_lang", "fr");
    const { result } = renderHook(() => useLang());
    expect(result.current[0]).toBe("en");
  });
  it("starts in Bangla when stored", () => {
    localStorage.setItem("prothom_lang", "bn");
    const { result } = renderHook(() => useLang());
    expect(result.current[0]).toBe("bn");
  });
});

describe("useT", () => {
  it("returns English, then Bangla after toggling, for every mounted hook", () => {
    const { result } = renderHook(() => useT());
    expect(result.current("Jobs", "চাকরি")).toBe("Jobs");
    act(() => setLang("bn"));
    expect(result.current("Jobs", "চাকরি")).toBe("চাকরি");
  });
  it("falls back to English when no Bangla string is given", () => {
    const { result } = renderHook(() => useT());
    act(() => setLang("bn"));
    expect(result.current("Only English")).toBe("Only English");
    expect(result.current("Only English", null)).toBe("Only English");
    expect(result.current("Empty bn", "")).toBe("");
  });
});
