"""
Bangladesh Top Corporate Offices - Scraper & Career Portal Integrator.
Fetches authentic corporate logos, connects direct career portals,
and updates the Sonarhorin Featured Companies database.
"""
import io
import logging
import os
import urllib.request
from PIL import Image
from django.conf import settings
from django.utils.text import slugify

logger = logging.getLogger(__name__)

TOP_BANGLADESH_CORPORATES = [
    {
        "name": "Grameenphone",
        "slug": "grameenphone",
        "domain": "grameenphone.com",
        "website": "https://www.grameenphone.com",
        "careers_url": "https://www.grameenphone.com/about/careers",
        "industry": "Telecommunications",
        "city": "Dhaka",
        "color": "#0099FF",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Grameenphone_Logo_GP_Logo.svg/330px-Grameenphone_Logo_GP_Logo.svg.png",
    },
    {
        "name": "bKash Limited",
        "slug": "bkash",
        "domain": "bkash.com",
        "website": "https://www.bkash.com",
        "careers_url": "https://www.bkash.com/career",
        "industry": "Fintech & Mobile Banking",
        "city": "Dhaka",
        "color": "#E2136E",
        "wiki_img": None,
    },
    {
        "name": "BRAC",
        "slug": "brac",
        "domain": "brac.net",
        "website": "https://www.brac.net",
        "careers_url": "https://careers.brac.net",
        "industry": "Global Development & NGO",
        "city": "Dhaka",
        "color": "#ED1C24",
        "wiki_img": None,
    },
    {
        "name": "BAT Bangladesh",
        "slug": "bat-bangladesh",
        "domain": "bat.com",
        "website": "https://www.batbangladesh.com",
        "careers_url": "https://careers.bat.com",
        "industry": "FMCG & Conglomerate",
        "city": "Dhaka",
        "color": "#002D72",
        "wiki_img": None,
    },
    {
        "name": "Unilever Bangladesh",
        "slug": "unilever-bangladesh",
        "domain": "unilever.com",
        "website": "https://www.unilever.com.bd",
        "careers_url": "https://careers.unilever.com/bangladesh",
        "industry": "FMCG & Consumer Goods",
        "city": "Dhaka",
        "color": "#1F36C7",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/en/thumb/e/e4/Unilever.svg/330px-Unilever.svg.png",
    },
    {
        "name": "Square Pharmaceuticals",
        "slug": "square-pharmaceuticals",
        "domain": "squarepharma.com",
        "website": "https://squarepharma.com.bd",
        "careers_url": "https://squarepharma.com.bd/career.php",
        "industry": "Pharmaceuticals",
        "city": "Dhaka",
        "color": "#E31B23",
        "wiki_img": None,
    },
    {
        "name": "Walton Hi-Tech Industries",
        "slug": "walton",
        "domain": "waltonbd.com",
        "website": "https://waltonbd.com",
        "careers_url": "https://waltonbd.com/career",
        "industry": "Consumer Electronics & Tech",
        "city": "Dhaka",
        "color": "#005BAC",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Walton_Group_Logo.png/330px-Walton_Group_Logo.png",
    },
    {
        "name": "Pathao",
        "slug": "pathao",
        "domain": "pathao.com",
        "website": "https://pathao.com",
        "careers_url": "https://pathao.com/careers",
        "industry": "Tech & On-Demand Logistics",
        "city": "Dhaka",
        "color": "#E83828",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Pathao_-_Here_with_You.png/330px-Pathao_-_Here_with_You.png",
    },
    {
        "name": "Robi Axiata Limited",
        "slug": "robi-axiata",
        "domain": "robi.com.bd",
        "website": "https://www.robi.com.bd",
        "careers_url": "https://www.robi.com.bd/en/corporate/careers",
        "industry": "Telecommunications",
        "city": "Dhaka",
        "color": "#ED1C24",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/Robi_Axiata_logo.svg/330px-Robi_Axiata_logo.svg.png",
    },
    {
        "name": "Banglalink Digital",
        "slug": "banglalink",
        "domain": "banglalink.net",
        "website": "https://www.banglalink.net",
        "careers_url": "https://www.banglalink.net/en/corporate/careers",
        "industry": "Telecommunications",
        "city": "Dhaka",
        "color": "#FF6600",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/a2/Banglalink_logo_2016.svg/330px-Banglalink_logo_2016.svg.png",
    },
    {
        "name": "Beximco Pharmaceuticals",
        "slug": "beximco-pharma",
        "domain": "beximcopharma.com",
        "website": "https://www.beximcopharma.com",
        "careers_url": "https://www.beximcopharma.com/careers",
        "industry": "Pharmaceuticals",
        "city": "Dhaka",
        "color": "#005596",
        "wiki_img": None,
    },
    {
        "name": "BRAC Bank PLC",
        "slug": "brac-bank",
        "domain": "bracbank.com",
        "website": "https://www.bracbank.com",
        "careers_url": "https://www.bracbank.com/en/career",
        "industry": "Banking & Financial Services",
        "city": "Dhaka",
        "color": "#004F9E",
        "wiki_img": None,
    },
    {
        "name": "Daraz Bangladesh",
        "slug": "daraz",
        "domain": "daraz.com.bd",
        "website": "https://www.daraz.com.bd",
        "careers_url": "https://careers.daraz.com",
        "industry": "E-Commerce & Tech",
        "city": "Dhaka",
        "color": "#F85606",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Daraz_Logo.png/330px-Daraz_Logo.png",
    },
    {
        "name": "Standard Chartered Bangladesh",
        "slug": "standard-chartered",
        "domain": "sc.com",
        "website": "https://www.sc.com/bd",
        "careers_url": "https://www.sc.com/en/careers/",
        "industry": "Banking & Financial Services",
        "city": "Dhaka",
        "color": "#008453",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Standard_Chartered_%282021%29.svg/330px-Standard_Chartered_%282021%29.svg.png",
    },
    {
        "name": "The City Bank PLC",
        "slug": "city-bank",
        "domain": "thecitybank.com",
        "website": "https://www.thecitybank.com",
        "careers_url": "https://www.thecitybank.com/career",
        "industry": "Banking & Finance",
        "city": "Dhaka",
        "color": "#D71920",
        "wiki_img": None,
    },
    {
        "name": "PRAN-RFL Group",
        "slug": "pran-rfl",
        "domain": "pranfoods.net",
        "website": "https://pranrflgroup.com",
        "careers_url": "https://pranrflgroup.com/career",
        "industry": "FMCG & Industrial Conglomerate",
        "city": "Dhaka",
        "color": "#E31E24",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/en/thumb/d/db/Pran-RFL_Group_logo.svg/330px-Pran-RFL_Group_logo.svg.png",
    },
    {
        "name": "ACI Limited",
        "slug": "aci-limited",
        "domain": "aci-bd.com",
        "website": "https://www.aci-bd.com",
        "careers_url": "https://www.aci-bd.com/careers.php",
        "industry": "Healthcare & Consumer Goods",
        "city": "Dhaka",
        "color": "#004B87",
        "wiki_img": None,
    },
    {
        "name": "Shwapno",
        "slug": "shwapno",
        "domain": "shwapno.com",
        "website": "https://www.shwapno.com",
        "careers_url": "https://www.shwapno.com/career",
        "industry": "Retail & Supermarket Chain",
        "city": "Dhaka",
        "color": "#ED1C24",
        "wiki_img": None,
    },
    {
        "name": "Incepta Pharmaceuticals",
        "slug": "incepta-pharma",
        "domain": "inceptapharma.com",
        "website": "https://www.inceptapharma.com",
        "careers_url": "https://www.inceptapharma.com/career.php",
        "industry": "Pharmaceuticals",
        "city": "Dhaka",
        "color": "#0072CE",
        "wiki_img": None,
    },
    {
        "name": "Akij Group",
        "slug": "akij-group",
        "domain": "akij.net",
        "website": "https://akij.net",
        "careers_url": "https://akij.net/career/",
        "industry": "Conglomerate & Manufacturing",
        "city": "Dhaka",
        "color": "#EE3124",
        "wiki_img": None,
    },
    {
        "name": "Chaldal",
        "slug": "chaldal",
        "domain": "chaldal.com",
        "website": "https://chaldal.com",
        "careers_url": "https://chaldal.com/careers",
        "industry": "Tech & Quick Grocery",
        "city": "Dhaka",
        "color": "#FFB800",
        "wiki_img": None,
    },
    {
        "name": "Nagad",
        "slug": "nagad",
        "domain": "nagad.com.bd",
        "website": "https://nagad.com.bd",
        "careers_url": "https://nagad.com.bd/career",
        "industry": "Fintech & Digital Financial Services",
        "city": "Dhaka",
        "color": "#F7941D",
        "wiki_img": None,
    },
    {
        "name": "Renata Limited",
        "slug": "renata",
        "domain": "renata-ltd.com",
        "website": "https://renata-ltd.com",
        "careers_url": "https://renata-ltd.com/careers/",
        "industry": "Pharmaceuticals",
        "city": "Dhaka",
        "color": "#008542",
        "wiki_img": None,
    },
    {
        "name": "Apex Footwear",
        "slug": "apex-footwear",
        "domain": "apexfootwearltd.com",
        "website": "https://apexfootwearltd.com",
        "careers_url": "https://apexfootwearltd.com/careers",
        "industry": "Retail & Footwear Manufacturing",
        "city": "Dhaka",
        "color": "#E30613",
        "wiki_img": None,
    },
    {
        "name": "Eastern Bank PLC (EBL)",
        "slug": "ebl",
        "domain": "ebl.com.bd",
        "website": "https://www.ebl.com.bd",
        "careers_url": "https://www.ebl.com.bd/career",
        "industry": "Banking & Financial Services",
        "city": "Dhaka",
        "color": "#005CA9",
        "wiki_img": None,
    },
    {
        "name": "ShopUp",
        "slug": "shopup",
        "domain": "shopup.com.bd",
        "website": "https://shopup.com.bd",
        "careers_url": "https://shopup.com.bd/careers",
        "industry": "B2B Tech & Supply Chain",
        "city": "Dhaka",
        "color": "#2E3192",
        "wiki_img": None,
    },
    {
        "name": "Meghna Group (MGI)",
        "slug": "meghna-group",
        "domain": "mgi.org",
        "website": "https://www.mgi.org",
        "careers_url": "https://www.mgi.org/career",
        "industry": "Industrial Conglomerate",
        "city": "Dhaka",
        "color": "#E4232A",
        "wiki_img": None,
    },
    {
        "name": "Bashundhara Group",
        "slug": "bashundhara",
        "domain": "bashundharagroup.com",
        "website": "https://www.bashundharagroup.com",
        "careers_url": "https://www.bashundharagroup.com/careers/",
        "industry": "Conglomerate & Real Estate",
        "city": "Dhaka",
        "color": "#0054A6",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/bn/thumb/7/77/%E0%A6%AC%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A7%E0%A6%B0%E0%A6%BE_%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A7%81%E0%A6%AA%E0%A7%87%E0%A6%B0_%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%A4%E0%A7%80%E0%A6%95.svg/330px-%E0%A6%AC%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A7%E0%A6%B0%E0%A6%BE_%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A7%81%E0%A6%AA%E0%A7%87%E0%A6%B0_%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%A4%E0%A7%80%E0%A6%95.svg.png",
    },
    {
        "name": "Dutch-Bangla Bank (DBBL)",
        "slug": "dbbl",
        "domain": "dutchbanglabank.com",
        "website": "https://www.dutchbanglabank.com",
        "careers_url": "https://www.dutchbanglabank.com/online_job/",
        "industry": "Banking & Digital Payments",
        "city": "Dhaka",
        "color": "#EE2A24",
        "wiki_img": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Dutch-bangla-bank-ltd.svg/330px-Dutch-bangla-bank-ltd.svg.png",
    },
    {
        "name": "Marico Bangladesh",
        "slug": "marico",
        "domain": "marico.com",
        "website": "https://marico.com/bangladesh",
        "careers_url": "https://marico.com/bangladesh/careers",
        "industry": "FMCG & Personal Care",
        "city": "Dhaka",
        "color": "#005C8A",
        "wiki_img": None,
    },
]


def fetch_logo_image(info):
    """Fetches high-res logo from wiki, google high-res favicon, or brand sources."""
    sources = []
    if info.get("wiki_img"):
        sources.append(info["wiki_img"])

    domain = info["domain"]
    sources.append(
        f"https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://{domain}&size=256"
    )

    for url in sources:
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                if len(data) > 200:
                    img = Image.open(io.BytesIO(data))
                    return img
        except Exception as e:
            logger.debug(f"Failed to fetch {url}: {e}")
            continue
    return None


def sync_top_corporates():
    """Scrapes authentic logos and connects career portals for all top Bangladesh corporate offices."""
    from apps.jobs.models import Company

    media_logos_dir = os.path.join(settings.MEDIA_ROOT, "logos")
    os.makedirs(media_logos_dir, exist_ok=True)

    # Also save to frontend/public/logos for instant static serving if needed
    frontend_logos_dir = os.path.abspath(
        os.path.join(settings.BASE_DIR, "..", "frontend", "public", "logos")
    )
    os.makedirs(frontend_logos_dir, exist_ok=True)

    results = []

    for item in TOP_BANGLADESH_CORPORATES:
        slug = item["slug"]
        img = fetch_logo_image(item)

        logo_rel_path = f"logos/{slug}.png"
        saved = False

        if img:
            try:
                # Save as optimized PNG with RGBA transparency
                media_file = os.path.join(media_logos_dir, f"{slug}.png")
                frontend_file = os.path.join(frontend_logos_dir, f"{slug}.png")

                # If image is palette or P mode without alpha, convert to RGBA
                if img.mode != "RGBA":
                    img = img.convert("RGBA")

                img.save(media_file, "PNG", optimize=True)
                img.save(frontend_file, "PNG", optimize=True)
                saved = True
            except Exception as e:
                logger.error(f"Error saving logo for {slug}: {e}")

        # Update or create the Company in database
        company, created = Company.objects.update_or_create(
            name=item["name"],
            defaults={
                "slug": item["slug"],
                "website": item["website"],
                "careers_url": item["careers_url"],
                "industry": item["industry"],
                "city": item.get("city", "Dhaka"),
                "color": item["color"],
                "featured": True,
                "is_partner": True,
                "logo": logo_rel_path if saved else "",
            },
        )

        results.append(
            {
                "name": company.name,
                "slug": company.slug,
                "careers_url": company.careers_url,
                "logo_saved": saved,
                "created": created,
            }
        )

    return results
