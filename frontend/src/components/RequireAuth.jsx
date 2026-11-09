import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="page"><div className="wrap"><p className="muted">Loading…</p></div></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}
