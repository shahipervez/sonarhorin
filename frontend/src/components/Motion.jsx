import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Elements that slide/fade in as they scroll into view, on every page.
const REVEAL = [
  ".h2", ".sub", ".lead2", ".eyebrow", ".card", ".fcard", ".dtile", ".pcard", ".certcard", ".why-item",
  ".stat", ".step", ".player", ".story-player", ".search", ".how-head p", ".tabs", ".page-head",
].join(",");

/** Scroll progress bar + reveal-on-scroll for the whole site. */
export default function Motion() {
  const bar = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
  }, [pathname]);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    const seen = new WeakSet();
    const scan = () => {
      document.querySelectorAll(REVEAL).forEach((el, i) => {
        if (seen.has(el) || el.closest(".hero, .exam, .modal, .nav")) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) return; // already on screen: don't hide it
        el.classList.add("rv");
        el.style.transitionDelay = `${(i % 4) * 70}ms`;
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.querySelector("main"), { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  return <div className="scroll-prog" ref={bar} style={{ transform: "scaleX(0)", width: "100%" }} aria-hidden="true" />;
}
