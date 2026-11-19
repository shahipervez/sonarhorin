import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getTrack, hasChosenTrack, resetTrack, setTrack, TRACKS, useTrack } from "../track";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("TRACKS", () => {
  it("has job, internship and startup with bn/en labels", () => {
    expect(Object.keys(TRACKS)).toEqual(["job", "internship", "startup"]);
    for (const t of Object.values(TRACKS)) {
      expect(t.en).toBeTruthy();
      expect(t.bn).toMatch(/[ঀ-৿]/);
    }
  });
});

describe("getTrack / setTrack", () => {
  it("defaults to job", () => {
    expect(getTrack()).toBe("job");
  });
  it("ignores unknown stored values", () => {
    localStorage.setItem("prothom_track", "pirate");
    expect(getTrack()).toBe("job");
  });
  it("persists a valid choice and marks the session as chosen", () => {
    expect(hasChosenTrack()).toBe(false);
    setTrack("internship");
    expect(getTrack()).toBe("internship");
    expect(localStorage.getItem("prothom_track")).toBe("internship");
    expect(hasChosenTrack()).toBe(true);
  });
  it("rejects an invalid track", () => {
    setTrack("startup");
    setTrack("nope");
    expect(getTrack()).toBe("startup");
  });
});

describe("hasChosenTrack / resetTrack", () => {
  it("?gate in the URL forces the gate to show again", () => {
    setTrack("job");
    window.history.replaceState(null, "", "/?gate=1");
    expect(hasChosenTrack()).toBe(false);
  });
  it("resetTrack clears the session choice but keeps the last track", () => {
    setTrack("startup");
    resetTrack();
    expect(hasChosenTrack()).toBe(false);
    expect(getTrack()).toBe("startup");
  });
});

describe("useTrack", () => {
  it("re-renders every subscriber when the track changes", () => {
    const a = renderHook(() => useTrack());
    const b = renderHook(() => useTrack());
    expect(a.result.current[0]).toBe("job");
    act(() => a.result.current[1]("internship"));
    expect(a.result.current[0]).toBe("internship");
    expect(b.result.current[0]).toBe("internship");
    b.unmount();
    act(() => setTrack("startup"));
    expect(a.result.current[0]).toBe("startup");
  });
});
