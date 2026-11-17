import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import Footer from "./components/Footer";
import Signature from "./components/Signature";
import { setTrack } from "./track";
import Motion from "./components/Motion";
import Nav from "./components/Nav";
import RequireAuth from "./components/RequireAuth";

// Core routes eagerly loaded for instant initial render
import Home from "./pages/Home";
import Login from "./pages/Login";

// Code-split lazy routes for ultra-fast (< 1s) initial load
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CVJudge = lazy(() => import("./pages/CVJudge"));
const QuickTest = lazy(() => import("./pages/QuickTest"));
const Interview = lazy(() => import("./pages/Interview"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Applications = lazy(() => import("./pages/Jobs").then((m) => ({ default: m.Applications })));
const Internships = lazy(() => import("./pages/Internships"));
const Programs = lazy(() => import("./pages/Programs"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Verify = lazy(() => import("./pages/Verify"));
const Stories = lazy(() => import("./pages/Stories"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PublicSite = lazy(() => import("./pages/Portfolio").then((m) => ({ default: m.PublicSite })));
const Network = lazy(() => import("./pages/Network"));
const Startup = lazy(() => import("./pages/Startup"));
const Studio = lazy(() => import("./pages/Studio"));
const Coach = lazy(() => import("./pages/Coach"));
const Efficiency = lazy(() => import("./pages/Efficiency"));
const EfficiencyRun = lazy(() => import("./pages/EfficiencyRun"));

function PageFallback() {
  return (
    <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid rgba(255,194,61,0.2)",
          borderTopColor: "#FFC23D",
          borderRadius: "50%",
          animation: "shSpin 0.6s linear infinite",
        }}
      />
      <style>{`@keyframes shSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 80);
    else scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

const P = (el) => <RequireAuth>{el}</RequireAuth>;

function TrackSync() {
  const { user } = useAuth();
  useEffect(() => { if (user?.track) setTrack(user.track); }, [user?.track]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const exam = /^\/efficiency\/\d+/.test(pathname) || pathname.startsWith("/u/");
  return (
    <>
      <ScrollTop />
      <TrackSync />
      {!exam && <Motion />}
      {!exam && <Signature />}
      {!exam && <Nav />}
      <main>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/me" element={P(<Dashboard />)} />
            <Route path="/cv" element={P(<CVJudge />)} />
            <Route path="/quick-test" element={P(<QuickTest />)} />
            <Route path="/interview" element={P(<Interview />)} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/applications" element={P(<Applications />)} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/verify/:code" element={<Verify />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/u/:slug" element={<PublicSite />} />
            <Route path="/network" element={P(<Network />)} />
            <Route path="/startup" element={<Startup />} />
            <Route path="/studio" element={P(<Studio />)} />
            <Route path="/coach" element={P(<Coach />)} />
            <Route path="/efficiency" element={<Efficiency />} />
            <Route path="/efficiency/:id" element={P(<EfficiencyRun />)} />
            <Route path="*" element={<div className="page"><div className="wrap narrow"><h1 className="h2">Page not found</h1></div></div>} />
          </Routes>
        </Suspense>
      </main>
      {!exam && <Footer />}
    </>
  );
}