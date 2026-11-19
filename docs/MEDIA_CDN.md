# Media: keeping the site light, and moving videos to a CDN

## What is optimised already

`tools/optimize-media.sh` (needs `ffmpeg`) re-encodes every `frontend/public/**/*.mp4` in place:
H.264 High, CRF 30, shorter side ≤ 720 px, ≤ 30 fps, audio stripped (all clips are muted autoplay),
`+faststart`. A file is replaced only when the result is smaller. It also writes `forest-bg.webp`,
which `src/styles/login.css` loads through `image-set()` with the PNG as fallback.

| File | Before | After |
|---|---|---|
| wallpaper.mp4 (was 3840×2160 @ 60 fps) | 2,862,807 B | 210,428 B |
| arlecchino.mp4 (byte-identical copy of wallpaper.mp4, unused) | 2,862,807 B | removed |
| stories/intro.mp4 | 915,520 B | 469,874 B |
| stories/*.mp4 (11 category clips) | 1,817,480 B | 1,386,480 B |
| forest-bg.png → forest-bg.webp | 573,404 B | 33,720 B (PNG kept as fallback) |
| forest-login-ref.png (design reference, unused by the app) | 579,903 B | moved to `docs/design/` |
| **frontend/public total** | **10,177,915 B** | **3,819,803 B** |

Don't re-run the script on files it has already encoded unless you replaced them with new source
footage: each pass is lossy. WebM/VP9 was tried for the wallpaper and came out larger (366 KB vs
210 KB), so only MP4 ships.

## Moving media to a CDN (Cloudinary or Bunny)

Vercel's free bandwidth is shared with the app shell; video is better served from a CDN.

1. Upload the contents of `frontend/public/stories/` and `frontend/public/wallpaper.mp4` keeping
   the same paths:
   - **Bunny.net**: create a Storage Zone + Pull Zone, upload with the web UI or
     `curl -T file https://storage.bunnycdn.com/<zone>/stories/intro.mp4 -H "AccessKey: …"`.
     Base URL: `https://<pullzone>.b-cdn.net`.
   - **Cloudinary**: upload into a folder `sonarhorin` with “Use filename as public ID” on.
     Base URL: `https://res.cloudinary.com/<cloud>/video/upload/sonarhorin` (add `q_auto,f_auto/`
     after `upload/` for automatic format/quality).
2. Set `VITE_MEDIA_BASE=<base URL>` in the frontend build environment (Vercel project settings,
   or `frontend/.env.production`).
3. Wrap media paths with the helper in `frontend/src/media.js`:
   ```jsx
   import { media } from "../media";
   <video src={media("/stories/intro.mp4")} poster={media("/stories/intro.jpg")} />
   ```
   With `VITE_MEDIA_BASE` unset, `media()` returns the path unchanged, so local dev keeps using
   `frontend/public`. Usages are not refactored yet (StoryRail, IntroStory, EntryGate,
   LiveWallpaper); do that file by file.
4. Add the CDN host to `media-src` / `img-src` in the Content-Security-Policy
   (`frontend/nginx.conf`, `vercel.json`).
