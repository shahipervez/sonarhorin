"""
Generate high-fidelity vector SVG and crisp PNG logos for all 30 top Bangladesh Corporate Offices.
Saves to both backend/media/logos/ and frontend/public/logos/.
"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA_LOGOS = os.path.join(BASE_DIR, "media", "logos")
FRONTEND_LOGOS = os.path.join(BASE_DIR, "..", "frontend", "public", "logos")

os.makedirs(MEDIA_LOGOS, exist_ok=True)
os.makedirs(FRONTEND_LOGOS, exist_ok=True)

# SVG templates for each of the 30 corporate offices (viewBox="0 0 240 80")
LOGOS = {
    "bkash": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- bKash bird emblem -->
    <path d="M22 6 L38 20 L26 28 L32 44 L16 32 L8 40 L12 24 Z" fill="#E2136E"/>
    <path d="M22 6 L26 28 L16 32 Z" fill="#C20E5C"/>
  </g>
  <text x="74" y="47" font-family="'Inter',-apple-system,sans-serif" font-size="28" font-weight="900" fill="#222222" letter-spacing="-0.8">b<tspan fill="#E2136E">Kash</tspan></text>
  <text x="75" y="60" font-family="'Inter',-apple-system,sans-serif" font-size="8.5" font-weight="600" fill="#888888" letter-spacing="0.3">a BRAC Bank company</text>
</svg>""",

    "grameenphone": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 15)">
    <!-- Telenor / GP 3-petal propeller -->
    <path d="M24 25 C14 22 8 12 12 4 C16 -4 28 2 28 14 Z" fill="#00A3E0"/>
    <path d="M24 25 C34 22 44 28 42 38 C40 48 28 46 22 36 Z" fill="#0080B8"/>
    <path d="M24 25 C20 35 12 44 2 40 C-8 36 -2 24 10 20 Z" fill="#00B8F5"/>
  </g>
  <text x="72" y="48" font-family="'Inter',-apple-system,sans-serif" font-size="21" font-weight="800" fill="#00A3E0" letter-spacing="-0.5">grameenphone</text>
</svg>""",

    "robi-axiata": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(20, 16)">
    <!-- Axiata multi-facet prism -->
    <polygon points="24,6 40,24 24,24" fill="#ED1C24"/>
    <polygon points="24,6 8,24 24,24" fill="#F7931E"/>
    <polygon points="8,24 24,42 24,24" fill="#FFC20E"/>
    <polygon points="40,24 24,42 24,24" fill="#C1272D"/>
  </g>
  <text x="74" y="45" font-family="'Inter',-apple-system,sans-serif" font-size="30" font-weight="900" fill="#ED1C24" letter-spacing="-1">robi</text>
  <text x="75" y="58" font-family="'Inter',-apple-system,sans-serif" font-size="9" font-weight="700" fill="#555555" letter-spacing="1.5">AXIATA</text>
</svg>""",

    "banglalink": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 18)">
    <!-- Banglalink tiger stripes -->
    <path d="M6 38 C14 26 24 14 38 6 C32 18 22 30 14 42 Z" fill="#FF6600"/>
    <path d="M18 42 C26 30 36 18 46 14 C42 24 32 34 24 44 Z" fill="#FF8533"/>
    <circle cx="44" cy="8" r="4" fill="#FF6600"/>
  </g>
  <text x="74" y="49" font-family="'Inter',-apple-system,sans-serif" font-size="24" font-weight="800" fill="#FF6600" letter-spacing="-0.8">banglalink</text>
</svg>""",

    "brac-bank": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- BRAC Bank square + golden star -->
    <rect width="44" height="44" rx="8" fill="#003366"/>
    <polygon points="22,12 25,20 33,22 25,25 22,33 19,25 11,22 19,20" fill="#FFCC00"/>
  </g>
  <text x="72" y="40" font-family="'Inter',-apple-system,sans-serif" font-size="18" font-weight="900" fill="#003366" letter-spacing="0.5">BRAC BANK</text>
  <text x="73" y="55" font-family="'Inter',-apple-system,sans-serif" font-size="9" font-weight="600" fill="#777777" letter-spacing="0.2">আস্থা অবিচল · PLC</text>
</svg>""",

    "city-bank": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(20, 16)">
    <!-- 8-point geometric star -->
    <rect width="44" height="44" rx="8" fill="#D92528"/>
    <polygon points="22,9 25,18 35,22 25,26 22,35 19,26 9,22 19,18" fill="#FFFFFF"/>
  </g>
  <text x="74" y="38" font-family="'Inter',-apple-system,sans-serif" font-size="13" font-weight="600" fill="#666666" letter-spacing="1">THE</text>
  <text x="74" y="54" font-family="'Inter',-apple-system,sans-serif" font-size="20" font-weight="900" fill="#D92528" letter-spacing="-0.3">CITY BANK</text>
</svg>""",

    "dbbl": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- DBBL banyan emblem -->
    <circle cx="22" cy="22" r="22" fill="#007A3D"/>
    <circle cx="22" cy="16" r="10" fill="#ED1C24"/>
    <path d="M12 28 C12 20 32 20 32 28 L24 34 L20 34 Z" fill="#FFFFFF"/>
  </g>
  <text x="72" y="38" font-family="'Inter',-apple-system,sans-serif" font-size="14.5" font-weight="800" fill="#007A3D" letter-spacing="0.2">DUTCH-BANGLA</text>
  <text x="72" y="55" font-family="'Inter',-apple-system,sans-serif" font-size="16" font-weight="900" fill="#ED1C24" letter-spacing="0.5">BANK</text>
</svg>""",

    "ebl": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 18)">
    <rect width="44" height="42" rx="8" fill="#0B2545"/>
    <text x="22" y="29" font-family="'Inter',sans-serif" font-size="19" font-weight="900" fill="#FFFFFF" text-anchor="middle">EBL</text>
    <rect x="8" y="34" width="28" height="3" fill="#ED1C24"/>
  </g>
  <text x="72" y="42" font-family="'Inter',sans-serif" font-size="18" font-weight="800" fill="#0B2545">Eastern Bank</text>
  <text x="73" y="56" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#ED1C24" letter-spacing="0.8">PLC · 100% DIGITAL</text>
</svg>""",

    "standard-chartered": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(16, 20)">
    <!-- SC dual helix -->
    <path d="M12 28 C6 24 6 12 16 8 C26 4 30 18 20 24 C14 28 20 34 26 30" fill="none" stroke="#0079C1" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M22 10 C28 14 28 26 18 30 C8 34 4 20 14 14" fill="none" stroke="#00965E" stroke-width="4.5" stroke-linecap="round"/>
  </g>
  <text x="64" y="38" font-family="'Inter',sans-serif" font-size="14" font-weight="800" fill="#0079C1">Standard</text>
  <text x="64" y="55" font-family="'Inter',sans-serif" font-size="14" font-weight="800" fill="#00965E">Chartered</text>
</svg>""",

    "nagad": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- Nagad flame -->
    <path d="M22 4 C28 14 36 22 36 32 C36 40 28 46 20 46 C12 46 6 38 8 28 C9 22 16 16 18 10 Z" fill="#EE3124"/>
    <path d="M22 16 C26 22 28 26 28 32 C28 38 22 40 18 40 C14 40 12 34 14 28 Z" fill="#FFC20E"/>
  </g>
  <text x="68" y="47" font-family="'Inter',sans-serif" font-size="28" font-weight="900" fill="#EE3124" letter-spacing="-0.8">নগদ</text>
  <text x="134" y="47" font-family="'Inter',sans-serif" font-size="15" font-weight="700" fill="#555555" letter-spacing="0.2">nagad</text>
</svg>""",

    "brac": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(20, 16)">
    <circle cx="22" cy="22" r="22" fill="#EB1A55"/>
    <circle cx="22" cy="22" r="8" fill="#FFFFFF"/>
  </g>
  <text x="76" y="52" font-family="'Inter',sans-serif" font-size="36" font-weight="900" fill="#EB1A55" letter-spacing="-1.5">brac</text>
</svg>""",

    "unilever-bangladesh": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(22, 14)">
    <!-- Unilever U -->
    <path d="M8 8 C8 32 14 42 24 42 C34 42 40 32 40 8" fill="none" stroke="#1F36C7" stroke-width="6.5" stroke-linecap="round"/>
    <circle cx="12" cy="14" r="3" fill="#1F36C7"/>
    <circle cx="36" cy="14" r="3" fill="#1F36C7"/>
    <circle cx="24" cy="38" r="3" fill="#1F36C7"/>
  </g>
  <text x="76" y="47" font-family="'Inter',sans-serif" font-size="23" font-weight="800" fill="#1F36C7" letter-spacing="-0.3">Unilever</text>
  <text x="77" y="59" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#555555" letter-spacing="0.5">BANGLADESH</text>
</svg>""",

    "bat-bangladesh": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <rect width="44" height="44" rx="8" fill="#0B2341"/>
    <path d="M12 28 C14 16 30 16 32 28" fill="none" stroke="#E5A823" stroke-width="3"/>
    <circle cx="22" cy="22" r="5" fill="#E5A823"/>
  </g>
  <text x="72" y="41" font-family="'Inter',sans-serif" font-size="24" font-weight="900" fill="#0B2341" letter-spacing="1">BAT</text>
  <text x="73" y="56" font-family="'Inter',sans-serif" font-size="10" font-weight="700" fill="#E5A823" letter-spacing="0.6">BANGLADESH</text>
</svg>""",

    "pran-rfl": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(16, 16)">
    <!-- PRAN oval -->
    <ellipse cx="28" cy="22" rx="26" ry="18" fill="#E31B23"/>
    <text x="28" y="27" font-family="'Inter',sans-serif" font-size="14" font-weight="900" fill="#FFD200" text-anchor="middle" font-style="italic">PRAN</text>
  </g>
  <text x="78" y="40" font-family="'Inter',sans-serif" font-size="18" font-weight="900" fill="#E31B23">PRAN-RFL</text>
  <text x="79" y="55" font-family="'Inter',sans-serif" font-size="10" font-weight="700" fill="#555555" letter-spacing="0.5">GROUP · BD</text>
</svg>""",

    "marico": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- Sunburst + leaf -->
    <circle cx="22" cy="22" r="16" fill="#F39200"/>
    <circle cx="22" cy="22" r="8" fill="#FFCC00"/>
    <path d="M22 6 C32 6 36 16 36 22 C36 28 28 32 22 28 Z" fill="#78BE20"/>
  </g>
  <text x="72" y="50" font-family="'Inter',sans-serif" font-size="28" font-weight="900" fill="#2E7D32" letter-spacing="-0.8">marico</text>
</svg>""",

    "shwapno": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <circle cx="22" cy="22" r="20" fill="#00A651"/>
    <path d="M12 24 C16 14 28 14 32 24" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
    <circle cx="22" cy="14" r="3.5" fill="#FF6600"/>
  </g>
  <text x="72" y="44" font-family="'Inter',sans-serif" font-size="22" font-weight="900" fill="#00A651">shwapno</text>
  <text x="73" y="58" font-family="'Inter',sans-serif" font-size="10" font-weight="700" fill="#FF6600">স্বপ্ন · ACI Logistics</text>
</svg>""",

    "square-pharmaceuticals": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- Square red box + white cross -->
    <rect width="44" height="44" rx="6" fill="#E52427"/>
    <rect x="18" y="10" width="8" height="24" fill="#FFFFFF"/>
    <rect x="10" y="18" width="24" height="8" fill="#FFFFFF"/>
  </g>
  <text x="72" y="42" font-family="'Inter',sans-serif" font-size="23" font-weight="900" fill="#111111" letter-spacing="0.5">SQUARE</text>
  <text x="73" y="56" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#E52427" letter-spacing="0.5">PHARMACEUTICALS</text>
</svg>""",

    "beximco-pharma": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- Beximco triangle -->
    <polygon points="22,6 40,38 4,38" fill="#005B94"/>
    <polygon points="22,14 34,36 10,36" fill="#FFFFFF"/>
    <polygon points="22,22 28,34 16,34" fill="#005B94"/>
  </g>
  <text x="72" y="40" font-family="'Inter',sans-serif" font-size="18" font-weight="900" fill="#005B94" letter-spacing="0.5">BEXIMCO</text>
  <text x="73" y="55" font-family="'Inter',sans-serif" font-size="11" font-weight="700" fill="#333333" letter-spacing="1">PHARMA</text>
</svg>""",

    "incepta-pharma": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <circle cx="22" cy="22" r="18" fill="none" stroke="#1A4B8C" stroke-width="4"/>
    <circle cx="22" cy="22" r="8" fill="#F37021"/>
    <ellipse cx="22" cy="22" rx="21" ry="9" fill="none" stroke="#F37021" stroke-width="2.5" transform="rotate(30 22 22)"/>
  </g>
  <text x="72" y="44" font-family="'Inter',sans-serif" font-size="22" font-weight="800" fill="#1A4B8C">Incepta</text>
  <text x="73" y="57" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#F37021" letter-spacing="0.5">PHARMACEUTICALS</text>
</svg>""",

    "renata": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(20, 16)">
    <rect width="42" height="44" rx="8" fill="#1E7E34"/>
    <path d="M21 8 L32 20 L21 36 L10 20 Z" fill="#FFFFFF"/>
    <circle cx="21" cy="20" r="4" fill="#1E7E34"/>
  </g>
  <text x="72" y="46" font-family="'Inter',sans-serif" font-size="24" font-weight="900" fill="#1E7E34" letter-spacing="0.5">RENATA</text>
  <text x="73" y="58" font-family="'Inter',sans-serif" font-size="8.5" font-weight="700" fill="#666666" letter-spacing="1">LIMITED · BD</text>
</svg>""",

    "walton": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- Walton oval + crown -->
    <ellipse cx="24" cy="22" rx="22" ry="16" fill="#0055A5"/>
    <polygon points="12,14 18,24 24,14 30,24 36,14 36,28 12,28" fill="#FFFFFF"/>
  </g>
  <text x="72" y="44" font-family="'Inter',sans-serif" font-size="22" font-weight="900" fill="#0055A5" letter-spacing="0.5">WALTON</text>
  <text x="73" y="57" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#E31B23" letter-spacing="0.5">HI-TECH INDUSTRIES</text>
</svg>""",

    "pathao": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- Pathao bird -->
    <path d="M4 36 C14 36 28 28 38 12 C30 20 20 22 12 18 C18 24 16 30 4 36 Z" fill="#ED1C24"/>
    <circle cx="34" cy="14" r="3" fill="#ED1C24"/>
  </g>
  <text x="68" y="50" font-family="'Inter',sans-serif" font-size="28" font-weight="900" fill="#ED1C24" letter-spacing="-0.8">pathao</text>
</svg>""",

    "daraz": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <!-- Daraz D cube -->
    <rect width="44" height="44" rx="12" fill="#FF6600"/>
    <path d="M16 12 L28 12 C34 12 36 16 36 22 C36 28 34 32 28 32 L16 32 Z" fill="#FFFFFF"/>
    <path d="M22 18 L26 18 C28 18 30 19 30 22 C30 25 28 26 26 26 L22 26 Z" fill="#FF6600"/>
  </g>
  <text x="72" y="44" font-family="'Inter',sans-serif" font-size="24" font-weight="900" fill="#FF6600" letter-spacing="-0.5">daraz</text>
  <text x="73" y="57" font-family="'Inter',sans-serif" font-size="8.5" font-weight="600" fill="#888888">an Alibaba company</text>
</svg>""",

    "chaldal": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <rect width="44" height="44" rx="10" fill="#FFB800"/>
    <path d="M14 22 L30 22 L27 34 L17 34 Z" fill="#2E7D32"/>
    <circle cx="22" cy="18" r="4" fill="#E52427"/>
  </g>
  <text x="72" y="49" font-family="'Inter',sans-serif" font-size="26" font-weight="900" fill="#2E7D32" letter-spacing="-0.5">chaldal</text>
</svg>""",

    "shopup": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <rect width="44" height="44" rx="12" fill="#7B2CBF"/>
    <path d="M28 14 C20 14 16 18 16 22 C16 28 28 26 28 32 C28 36 24 38 18 36" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
  </g>
  <text x="72" y="48" font-family="'Inter',sans-serif" font-size="24" font-weight="900" fill="#7B2CBF" letter-spacing="-0.5">ShopUp</text>
</svg>""",

    "aci-limited": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <circle cx="22" cy="22" r="22" fill="#007A87"/>
    <text x="22" y="29" font-family="'Inter',sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">A</text>
  </g>
  <text x="72" y="44" font-family="'Inter',sans-serif" font-size="26" font-weight="900" fill="#007A87" letter-spacing="1">ACI</text>
  <text x="73" y="58" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#555555" letter-spacing="0.5">LIMITED · BANGLADESH</text>
</svg>""",

    "akij-group": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <rect width="44" height="44" rx="8" fill="#8B0000"/>
    <polygon points="22,10 32,32 12,32" fill="#FFD700"/>
    <text x="22" y="30" font-family="'Inter',sans-serif" font-size="12" font-weight="900" fill="#8B0000" text-anchor="middle">A</text>
  </g>
  <text x="72" y="42" font-family="'Inter',sans-serif" font-size="20" font-weight="900" fill="#8B0000" letter-spacing="0.5">AKIJ GROUP</text>
  <text x="73" y="56" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#B8860B" letter-spacing="0.8">TRUSTED SINCE 1940</text>
</svg>""",

    "bashundhara": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(16, 16)">
    <!-- Sunburst circle -->
    <circle cx="24" cy="22" r="22" fill="#B8860B"/>
    <circle cx="24" cy="22" r="16" fill="#8B0000"/>
    <circle cx="24" cy="22" r="8" fill="#FFD700"/>
  </g>
  <text x="72" y="39" font-family="'Inter',sans-serif" font-size="16" font-weight="900" fill="#8B0000" letter-spacing="0.5">BASHUNDHARA</text>
  <text x="72" y="54" font-family="'Inter',sans-serif" font-size="13" font-weight="800" fill="#B8860B" letter-spacing="0.8">GROUP · বসুন্ধরা</text>
</svg>""",

    "meghna-group": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <rect width="44" height="44" rx="8" fill="#005596"/>
    <path d="M10 26 C16 18 26 18 34 26" fill="none" stroke="#D71920" stroke-width="4"/>
    <text x="22" y="22" font-family="'Inter',sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">MGI</text>
  </g>
  <text x="72" y="41" font-family="'Inter',sans-serif" font-size="20" font-weight="900" fill="#005596" letter-spacing="0.5">MEGHNA GROUP</text>
  <text x="73" y="55" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#D71920" letter-spacing="0.5">OF INDUSTRIES (MGI)</text>
</svg>""",

    "apex-footwear": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <rect width="240" height="80" rx="12" fill="#FFFFFF"/>
  <g transform="translate(18, 16)">
    <rect width="44" height="44" rx="8" fill="#D71920"/>
    <polygon points="12,30 22,14 32,30" fill="#FFFFFF"/>
  </g>
  <text x="72" y="44" font-family="'Inter',sans-serif" font-size="26" font-weight="900" fill="#D71920" font-style="italic" letter-spacing="-0.5">Apex</text>
  <text x="73" y="57" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#333333" letter-spacing="0.5">FOOTWEAR LIMITED</text>
</svg>"""
}

# Generate PNG raster using PIL as direct fallbacks
COLOR_MAP = {
    "bkash": ((226, 19, 110), "bKash"),
    "grameenphone": ((0, 163, 224), "GP"),
    "robi-axiata": ((237, 28, 36), "robi"),
    "banglalink": ((255, 102, 0), "banglalink"),
    "brac-bank": ((0, 51, 102), "BRAC BANK"),
    "city-bank": ((217, 37, 40), "CITY BANK"),
    "dbbl": ((0, 122, 61), "DBBL"),
    "ebl": ((11, 37, 69), "EBL"),
    "standard-chartered": ((0, 121, 193), "StanChart"),
    "nagad": ((238, 49, 36), "নগদ"),
    "brac": ((235, 26, 85), "brac"),
    "unilever-bangladesh": ((31, 54, 199), "Unilever"),
    "bat-bangladesh": ((11, 35, 65), "BAT BD"),
    "pran-rfl": ((227, 27, 35), "PRAN"),
    "marico": ((243, 146, 0), "marico"),
    "shwapno": ((0, 166, 81), "shwapno"),
    "square-pharmaceuticals": ((229, 36, 39), "SQUARE"),
    "beximco-pharma": ((0, 91, 148), "BEXIMCO"),
    "incepta-pharma": ((26, 75, 140), "Incepta"),
    "renata": ((30, 126, 52), "RENATA"),
    "walton": ((0, 85, 165), "WALTON"),
    "pathao": ((237, 28, 36), "pathao"),
    "daraz": ((255, 102, 0), "daraz"),
    "chaldal": ((46, 125, 50), "chaldal"),
    "shopup": ((123, 44, 191), "ShopUp"),
    "aci-limited": ((0, 122, 135), "ACI"),
    "akij-group": ((139, 0, 0), "AKIJ"),
    "bashundhara": ((184, 134, 11), "BASHUNDHARA"),
    "meghna-group": ((0, 85, 150), "MGI"),
    "apex-footwear": ((215, 25, 32), "Apex"),
}

def create_raster_png(slug, out_path):
    color, text = COLOR_MAP.get(slug, ((255, 194, 61), slug.upper()[:4]))
    img = Image.new("RGBA", (320, 120), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Rounded badge box
    draw.rounded_rectangle([(16, 16), (104, 104)], radius=20, fill=color)
    # White initial on the badge
    initial = text[0].upper()
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        font_text = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
    except Exception:
        font_large = ImageFont.load_default()
        font_text = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    draw.text((60, 60), initial, fill=(255, 255, 255), font=font_large, anchor="mm")
    # Brand name text
    draw.text((124, 50), text, fill=(20, 24, 38), font=font_text, anchor="lm")
    draw.text((124, 78), "Official Corporate Office", fill=(120, 125, 140), font=font_sub, anchor="lm")
    img.save(out_path, "PNG")

def main():
    print(f"Generating 30 high-res SVG & PNG logos...")
    for slug, svg_content in LOGOS.items():
        # Save SVG to media and public
        svg_media = os.path.join(MEDIA_LOGOS, f"{slug}.svg")
        svg_public = os.path.join(FRONTEND_LOGOS, f"{slug}.svg")
        with open(svg_media, "w", encoding="utf-8") as f:
            f.write(svg_content)
        with open(svg_public, "w", encoding="utf-8") as f:
            f.write(svg_content)

        # Also create crisp PNG
        png_media = os.path.join(MEDIA_LOGOS, f"{slug}.png")
        png_public = os.path.join(FRONTEND_LOGOS, f"{slug}.png")
        create_raster_png(slug, png_media)
        create_raster_png(slug, png_public)

    print("Successfully generated all 30 corporate logos in SVG and PNG!")

if __name__ == "__main__":
    main()
