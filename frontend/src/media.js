/**
 * Media URL helper — lets heavy static media (videos, big images) live on a CDN.
 *
 *   import { media } from "./media";
 *   <video src={media("/stories/intro.mp4")} poster={media("/stories/intro.jpg")} />
 *
 * Set VITE_MEDIA_BASE at build time (e.g. in Vercel → Environment Variables):
 *   VITE_MEDIA_BASE=https://res.cloudinary.com/<cloud>/video/upload/sonarhorin
 *   VITE_MEDIA_BASE=https://sonarhorin.b-cdn.net
 * Unset (default) → files are served from frontend/public as today, so nothing changes locally.
 * See docs/MEDIA_CDN.md for the upload steps.
 */
const BASE = String(import.meta.env?.VITE_MEDIA_BASE || "").replace(/\/+$/, "");

export function media(path) {
  if (!path) return path;
  // Absolute URLs (https:, data:, blob:) and API-served uploads are returned untouched.
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path) || path.startsWith("/media/") || path.startsWith("/api/")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${clean}`;
}

export const MEDIA_BASE = BASE;
export default media;
