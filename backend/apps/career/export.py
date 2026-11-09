"""Tailored CV + cover letter → PDF (ReportLab) or DOCX (python-docx). ATS-friendly: single column, real text."""
import io
from datetime import date
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer

from .services import normalize_profile

THEMES = {
    "modern": {"accent": colors.HexColor("#B7791F"), "ink": colors.HexColor("#14121F"), "muted": colors.HexColor("#5B5870"),
               "head_font": "Helvetica-Bold", "body": "Helvetica", "name_size": 24, "align": TA_LEFT},
    "classic": {"accent": colors.HexColor("#1F2A44"), "ink": colors.HexColor("#111111"), "muted": colors.HexColor("#444444"),
                "head_font": "Times-Bold", "body": "Times-Roman", "name_size": 22, "align": TA_CENTER},
    "minimal": {"accent": colors.HexColor("#111111"), "ink": colors.HexColor("#1A1A1A"), "muted": colors.HexColor("#6B6B6B"),
                "head_font": "Helvetica-Bold", "body": "Helvetica", "name_size": 20, "align": TA_LEFT},
}


def _e(s):
    return escape(str(s or ""))


def _contact_bits(c):
    return [x for x in (c.get("email"), c.get("phone"), c.get("location"), c.get("linkedin"), c.get("github"), c.get("website")) if x]


def _styles(t):
    th = THEMES.get(t, THEMES["modern"])
    return th, {
        "name": ParagraphStyle("name", fontName=th["head_font"], fontSize=th["name_size"], leading=th["name_size"] + 4,
                               textColor=th["ink"], alignment=th["align"]),
        "headline": ParagraphStyle("hl", fontName=th["body"], fontSize=11, leading=15, textColor=th["accent"], alignment=th["align"], spaceBefore=2),
        "contact": ParagraphStyle("ct", fontName=th["body"], fontSize=8.8, leading=12, textColor=th["muted"], alignment=th["align"], spaceBefore=4),
        "h": ParagraphStyle("h", fontName=th["head_font"], fontSize=9.5, leading=12, textColor=th["accent"], spaceBefore=11, spaceAfter=3),
        "body": ParagraphStyle("b", fontName=th["body"], fontSize=9.6, leading=13.4, textColor=th["ink"]),
        "item": ParagraphStyle("it", fontName=th["head_font"], fontSize=9.8, leading=13.4, textColor=th["ink"], spaceBefore=4),
        "meta": ParagraphStyle("m", fontName=th["body"], fontSize=8.8, leading=12, textColor=th["muted"]),
        "bullet": ParagraphStyle("bl", fontName=th["body"], fontSize=9.4, leading=13, textColor=th["ink"], leftIndent=10, bulletIndent=1),
        "letter": ParagraphStyle("lt", fontName=th["body"], fontSize=10.5, leading=16, textColor=th["ink"], spaceAfter=9),
    }


def _section(story, title, st, th):
    story.append(Paragraph(_e(title.upper()), st["h"]))
    story.append(HRFlowable(width="100%", thickness=0.6, color=th["accent"], spaceBefore=0, spaceAfter=4))


def resume_pdf(content: dict, template: str = "modern") -> bytes:
    p = normalize_profile(content)
    th, st = _styles(template)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=17 * mm, rightMargin=17 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
                            title=f"{p['name']} — CV", author=p["name"] or "Sonarhorin")
    s = [Paragraph(_e(p["name"] or "Your Name"), st["name"])]
    if p["headline"]:
        s.append(Paragraph(_e(p["headline"]), st["headline"]))
    if bits := _contact_bits(p["contact"]):
        s.append(Paragraph("  ·  ".join(_e(b) for b in bits), st["contact"]))
    if p["summary"]:
        _section(s, "Summary", st, th)
        s.append(Paragraph(_e(p["summary"]), st["body"]))
    if p["skills"]:
        _section(s, "Skills", st, th)
        s.append(Paragraph("  ·  ".join(_e(x) for x in p["skills"]), st["body"]))
    if p["experience"]:
        _section(s, "Experience", st, th)
        for e in p["experience"]:
            head = " — ".join(x for x in (e["role"], e["org"]) if x)
            block = [Paragraph(_e(head), st["item"])]
            meta = "  ·  ".join(x for x in (e["period"], e["location"]) if x)
            if meta:
                block.append(Paragraph(_e(meta), st["meta"]))
            block += [Paragraph(_e(b), st["bullet"], bulletText="•") for b in e["bullets"]]
            s.append(KeepTogether(block))
    if p["projects"]:
        _section(s, "Projects", st, th)
        for pr in p["projects"]:
            block = [Paragraph(_e(pr["name"]) + (f' <font color="#{th["muted"].hexval()[2:]}">— {_e(pr["tech"])}</font>' if pr["tech"] else ""), st["item"])]
            if pr["link"]:
                block.append(Paragraph(_e(pr["link"]), st["meta"]))
            block += [Paragraph(_e(b), st["bullet"], bulletText="•") for b in pr["bullets"]]
            s.append(KeepTogether(block))
    if p["education"]:
        _section(s, "Education", st, th)
        for ed in p["education"]:
            s.append(Paragraph(_e(" — ".join(x for x in (ed["degree"], ed["institution"]) if x)), st["item"]))
            meta = "  ·  ".join(x for x in (ed["period"], ed["result"]) if x)
            if meta:
                s.append(Paragraph(_e(meta), st["meta"]))
    for key, title in (("certifications", "Certifications"), ("achievements", "Achievements"), ("languages", "Languages")):
        if p[key]:
            _section(s, title, st, th)
            s += [Paragraph(_e(x), st["bullet"], bulletText="•") for x in p[key]]
    doc.build(s)
    return buf.getvalue()


def cover_pdf(content: dict, job_title: str, company: str, template: str = "modern") -> bytes:
    p = normalize_profile(content)
    th, st = _styles(template)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=24 * mm, rightMargin=24 * mm, topMargin=22 * mm, bottomMargin=20 * mm,
                            title=f"Cover letter — {job_title}")
    s = [Paragraph(_e(p["name"] or "Your Name"), st["name"])]
    if bits := _contact_bits(p["contact"]):
        s.append(Paragraph("  ·  ".join(_e(b) for b in bits), st["contact"]))
    s += [Spacer(1, 6 * mm), HRFlowable(width="100%", thickness=0.6, color=th["accent"]), Spacer(1, 6 * mm),
          Paragraph(date.today().strftime("%d %B %Y"), st["meta"]), Spacer(1, 2 * mm),
          Paragraph(_e(f"Re: {job_title}" + (f" — {company}" if company else "")), st["item"]), Spacer(1, 5 * mm)]
    for para in (content.get("cover_letter") or "").split("\n\n"):
        if para.strip():
            s.append(Paragraph(_e(para.strip()).replace("\n", "<br/>"), st["letter"]))
    doc.build(s)
    return buf.getvalue()


# ----------------------------------------------------------------------------- DOCX
def _docx_base():
    import docx
    from docx.shared import Pt

    d = docx.Document()
    for sec in d.sections:
        sec.left_margin = sec.right_margin = docx.shared.Mm(17)
        sec.top_margin = sec.bottom_margin = docx.shared.Mm(15)
    normal = d.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    return d


def _docx_head(d, p):
    from docx.shared import Pt, RGBColor

    h = d.add_paragraph()
    r = h.add_run(p["name"] or "Your Name")
    r.bold, r.font.size = True, Pt(22)
    if p["headline"]:
        r = d.add_paragraph().add_run(p["headline"])
        r.font.color.rgb, r.font.size = RGBColor(0xB7, 0x79, 0x1F), Pt(11.5)
    if bits := _contact_bits(p["contact"]):
        r = d.add_paragraph().add_run("  ·  ".join(bits))
        r.font.size, r.font.color.rgb = Pt(9), RGBColor(0x5B, 0x58, 0x70)


def resume_docx(content: dict, template: str = "modern") -> bytes:
    from docx.shared import Pt, RGBColor

    p = normalize_profile(content)
    d = _docx_base()
    _docx_head(d, p)

    def section(title):
        para = d.add_paragraph()
        para.paragraph_format.space_before = Pt(10)
        r = para.add_run(title.upper())
        r.bold, r.font.size, r.font.color.rgb = True, Pt(10), RGBColor(0xB7, 0x79, 0x1F)

    def bullet(text):
        d.add_paragraph(text, style="List Bullet")

    if p["summary"]:
        section("Summary")
        d.add_paragraph(p["summary"])
    if p["skills"]:
        section("Skills")
        d.add_paragraph("  ·  ".join(p["skills"]))
    if p["experience"]:
        section("Experience")
        for e in p["experience"]:
            para = d.add_paragraph()
            para.add_run(" — ".join(x for x in (e["role"], e["org"]) if x)).bold = True
            meta = "  ·  ".join(x for x in (e["period"], e["location"]) if x)
            if meta:
                para.add_run(f"   {meta}").italic = True
            for b in e["bullets"]:
                bullet(b)
    if p["projects"]:
        section("Projects")
        for pr in p["projects"]:
            para = d.add_paragraph()
            para.add_run(pr["name"]).bold = True
            if pr["tech"]:
                para.add_run(f" — {pr['tech']}")
            if pr["link"]:
                d.add_paragraph(pr["link"])
            for b in pr["bullets"]:
                bullet(b)
    if p["education"]:
        section("Education")
        for ed in p["education"]:
            para = d.add_paragraph()
            para.add_run(" — ".join(x for x in (ed["degree"], ed["institution"]) if x)).bold = True
            meta = "  ·  ".join(x for x in (ed["period"], ed["result"]) if x)
            if meta:
                para.add_run(f"   {meta}")
    for key, title in (("certifications", "Certifications"), ("achievements", "Achievements"), ("languages", "Languages")):
        if p[key]:
            section(title)
            for x in p[key]:
                bullet(x)
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()


def cover_docx(content: dict, job_title: str, company: str) -> bytes:
    p = normalize_profile(content)
    d = _docx_base()
    _docx_head(d, p)
    d.add_paragraph(date.today().strftime("%d %B %Y"))
    d.add_paragraph().add_run(f"Re: {job_title}" + (f" — {company}" if company else "")).bold = True
    for para in (content.get("cover_letter") or "").split("\n\n"):
        if para.strip():
            d.add_paragraph(para.strip())
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()
