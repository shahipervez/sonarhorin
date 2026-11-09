"""Landscape certificate PDF with verification code."""
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas

INK = colors.HexColor("#0E0F0C")
GREEN = colors.HexColor("#4B2FD6")
LIME = colors.HexColor("#FFC23D")
CREAM = colors.HexColor("#F6F5F0")


def build_certificate_pdf(cert) -> bytes:
    buf = io.BytesIO()
    W, H = landscape(A4)
    c = canvas.Canvas(buf, pagesize=(W, H))
    c.setTitle(f"Sonarhorin Certificate {cert.code}")
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.rect(0, 0, 26, H, fill=1, stroke=0)
    c.setFillColor(LIME)
    c.rect(26, 0, 8, H, fill=1, stroke=0)
    c.setStrokeColor(INK)
    c.setLineWidth(1.4)
    c.roundRect(60, 40, W - 100, H - 80, 14, stroke=1, fill=0)

    c.setFillColor(INK)
    c.setFont("Times-Roman", 30)
    c.drawString(90, H - 100, "Sonarhorin")
    c.setFillColor(colors.HexColor("#8cc63f"))
    c.circle(90 + c.stringWidth("Sonarhorin", "Times-Roman", 30) + 6, H - 98, 4, fill=1, stroke=0)

    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(90, H - 140, dict(cert.KIND).get(cert.kind, "Certificate").upper())
    c.setFillColor(INK)
    c.setFont("Times-Italic", 22)
    c.drawString(90, H - 185, "This certifies that")
    c.setFont("Times-Bold", 44)
    c.drawString(90, H - 240, cert.user.full_name[:40])
    c.setFont("Times-Roman", 20)
    c.drawString(90, H - 285, "has successfully completed")
    c.setFont("Helvetica-Bold", 22)
    c.drawString(90, H - 320, cert.title[:60])
    if cert.score is not None:
        c.setFont("Helvetica", 14)
        line = f"Score: {cert.score}%"
        if cert.details.get("integrity_score") is not None:
            line += f"   ·   Integrity: {cert.details['integrity_score']}%"
        c.drawString(90, H - 348, line)

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#6B6F66"))
    c.drawString(90, 90, f"Issued {cert.issued_at:%d %B %Y}  ·  Certificate ID {cert.code}")
    c.drawString(90, 74, f"Verify at {cert.verify_url}")

    # seal
    cx, cy = W - 170, 140
    c.setFillColor(LIME)
    c.circle(cx, cy, 58, fill=1, stroke=0)
    c.setStrokeColor(INK)
    c.circle(cx, cy, 50, fill=0, stroke=1)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(cx, cy + 6, "VERIFIED")
    c.setFont("Helvetica", 8)
    c.drawCentredString(cx, cy - 8, "FRESHER READY")
    c.showPage()
    c.save()
    return buf.getvalue()
