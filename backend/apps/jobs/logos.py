"""Real company logos only — downloaded from the company's own website, never drawn by us.

Order tried:
  1. extra URLs given by an admin (e.g. the logo file on Wikipedia/Wikimedia Commons)
  2. icons the company's homepage declares: apple-touch-icon, <link rel=icon> (largest), og:logo
  3. <origin>/favicon.ico
  4. Google's favicon service for that domain (it serves the company's own favicon)
If nothing usable is found the company simply has no logo and the UI shows its name.
"""
import io
import logging
import re
import urllib.parse
import urllib.request

from django.core.files.base import ContentFile

log = logging.getLogger("sonarhorin.logos")
UA = "Mozilla/5.0 (compatible; SonarhorinLogoBot/1.0; +https://sonarhorin.com)"
LINK_RX = re.compile(r"<link\b[^>]*>", re.I)
META_RX = re.compile(r"<meta\b[^>]*(?:property|name)=[\"']og:logo[\"'][^>]*>", re.I)
ATTR_RX = re.compile(r"""(\w[\w-]*)\s*=\s*["']([^"']*)["']""")
MIN_PX = 48


def fetch_bytes(url, timeout=12, limit=2_000_000):
    """Patched in tests."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,image/*,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(limit), r.headers.get("Content-Type", "")


def icon_candidates(page_url, html):
    """Icon URLs a homepage declares, best first."""
    found = []
    for tag in LINK_RX.findall(html or ""):
        a = {k.lower(): v for k, v in ATTR_RX.findall(tag)}
        rel = a.get("rel", "").lower()
        href = a.get("href")
        if not href or "icon" not in rel:
            continue
        size = max([int(x) for x in re.findall(r"(\d+)x\d+", a.get("sizes", ""))] or [0])
        if "apple-touch-icon" in rel:
            score = 10_000 + size
        elif href.lower().endswith(".svg") or "svg" in a.get("type", ""):
            score = 9_000
        else:
            score = size or 16
        found.append((score, urllib.parse.urljoin(page_url, href)))
    for tag in META_RX.findall(html or ""):
        a = {k.lower(): v for k, v in ATTR_RX.findall(tag)}
        if a.get("content"):
            found.append((9_500, urllib.parse.urljoin(page_url, a["content"])))
    return [u for _, u in sorted(found, key=lambda x: -x[0])]


def _usable(blob, ctype):
    """Return file extension if blob is a real image big enough to show, else None."""
    head = blob[:400].lstrip().lower()
    if b"<svg" in head or "svg" in ctype:
        return ".svg" if b"<svg" in blob[:2000].lower() else None
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(blob))
        if min(img.size) < MIN_PX:
            return None
        return {"PNG": ".png", "JPEG": ".jpg", "GIF": ".gif", "WEBP": ".webp", "ICO": ".ico"}.get(img.format, ".png")
    except Exception:
        return None


def fetch_real_logo(company, extra_urls=(), fetch=None):
    """Find and store a real logo on company.logo. Returns True when one was saved."""
    fetch = fetch or fetch_bytes
    urls = [u for u in extra_urls if u]
    site = (company.website or "").strip()
    if site:
        try:
            html, _ = fetch(site)
            urls += icon_candidates(site, html.decode("utf-8", "replace"))
        except Exception as exc:
            log.info("homepage fetch failed for %s: %s", company, exc)
        parts = urllib.parse.urlsplit(site)
        if parts.netloc:
            urls.append(f"{parts.scheme or 'https'}://{parts.netloc}/favicon.ico")
            urls.append(f"https://www.google.com/s2/favicons?domain={parts.netloc}&sz=256")
    for url in dict.fromkeys(urls):
        try:
            blob, ctype = fetch(url)
        except Exception:
            continue
        ext = _usable(blob, ctype or "")
        if not ext:
            continue
        company.logo.save(f"{company.slug}{ext}", ContentFile(blob), save=False)
        company.logo_source = url[:500]
        company.save(update_fields=["logo", "logo_source"])
        return True
    return False
