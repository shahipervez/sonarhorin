from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.assessments.models import EfficiencyTest, Question
from apps.assessments.question_bank import BANK
from apps.programs.models import Program
from apps.stories.models import SuccessStory
from apps.jobs.models import Company, Job


class Command(BaseCommand):
    help = "Load the MCQ bank, sample programs and efficiency tests (safe to run again)."

    def add_arguments(self, parser):
        parser.add_argument("--demo-user", action="store_true", help="Also create demo@prothom.dev / Prothom@2026")

    def handle(self, *args, **opts):
        added = 0
        for cat, topic, diff, text, options, ans, expl in BANK:
            _, created = Question.objects.update_or_create(
                text=text, category=cat,
                defaults={"topic": topic, "difficulty": diff, "options": options, "answer_index": ans, "explanation": expl},
            )
            added += created
        self.stdout.write(self.style.SUCCESS(f"Questions: {Question.objects.count()} ({added} new)"))

        # Rename rows created before the Prothom → Sonarhorin rebrand (keeps existing databases tidy)
        for p in Program.objects.filter(title__icontains="Prothom") | Program.objects.filter(organization__icontains="Prothom"):
            p.title = p.title.replace("Prothom", "Sonarhorin")
            p.organization = p.organization.replace("Prothom", "Sonarhorin")
            p.save(update_fields=["title", "organization"])
        EfficiencyTest.objects.filter(title="Prothom Verified Efficiency Test").update(title="Sonarhorin Verified Efficiency Test")

        today = timezone.localdate()
        programs = [
            dict(kind="graduate", title="Sonarhorin Graduate Program — Software Engineering", organization="Sonarhorin Academy",
                 summary="12-month paid rotation for fresh CSE graduates across backend, frontend and data teams.",
                 description="Rotate through three partner teams, ship real features with a mentor, and finish with a "
                             "full-time offer track. Weekly code reviews, monthly demo days.",
                 location="Dhaka (Banani)", mode="hybrid", duration="12 months", stipend="৳35,000/month", seats=20,
                 majors="CSE", requirements=["Graduated 2025–2026", "CGPA 3.00+", "Pass the Sonarhorin CSE Skill Check"],
                 curriculum=["Month 1: Engineering bootcamp", "Months 2–5: Backend rotation", "Months 6–9: Frontend/Data rotation", "Months 10–12: Final team + offer"],
                 perks=["Mentor", "Laptop", "Full-time offer track"], start=60, deadline=30),
            dict(kind="graduate", title="Management Trainee Officer (MTO) Program", organization="Sonarhorin Partner Network",
                 summary="Fast-track business leadership program for BBA / MBA freshers.",
                 description="Hands-on rotations in sales, supply chain, finance and HR with leadership coaching.",
                 location="Dhaka & Chattogram", mode="offline", duration="18 months", stipend="৳40,000/month", seats=15,
                 majors="BBA", requirements=["BBA/MBA graduate", "Strong communication", "Willing to travel"],
                 curriculum=["Sales territory", "Supply chain", "Finance & planning", "Capstone project"],
                 perks=["Leadership coaching", "Field allowance"], start=75, deadline=40),
            dict(kind="internship", title="Summer Internship — Data & AI", organization="Sonarhorin Labs",
                 summary="3-month paid internship building ML and analytics projects.",
                 description="Work on real datasets (Bangla NLP, demand forecasting) with a data scientist mentor.",
                 location="Dhaka", mode="hybrid", duration="3 months", stipend="৳15,000/month", seats=12,
                 majors="CSE,EEE", requirements=["Python basics", "Final-year or fresh graduate"],
                 curriculum=["Week 1: Onboarding", "Weeks 2–10: Project", "Weeks 11–12: Demo day"],
                 perks=["Certificate", "Recommendation letter"], start=30, deadline=20),
            dict(kind="internship", title="Electrical Site Internship — Power & Automation", organization="Sonarhorin Partner Network",
                 summary="Field internship at substations and factories: PLC, panels and safety.",
                 description="Learn substation operations, PLC programming and industrial safety on real sites.",
                 location="Gazipur", mode="offline", duration="2 months", stipend="৳12,000/month", seats=10,
                 majors="EEE", requirements=["EEE student/graduate", "Safety training (provided)"],
                 curriculum=["Safety & LOTO", "Substation basics", "PLC lab", "Site project"], perks=["PPE provided", "Transport"],
                 start=25, deadline=15),
            dict(kind="internship", title="Marketing & Content Internship", organization="Sonarhorin",
                 summary="Run real campaigns for Sonarhorin's youth audience.",
                 description="Plan social campaigns, write content, and measure results with our growth team.",
                 location="Dhaka", mode="hybrid", duration="3 months", stipend="৳10,000/month", seats=8,
                 majors="BBA,English,Other", requirements=["Strong writing in English and Bangla"],
                 curriculum=["Brand voice", "Campaign planning", "Analytics"], perks=["Portfolio pieces"], start=20, deadline=12),
            dict(kind="training", title="Job-Ready Bootcamp: Full-Stack (Django + React)", organization="Sonarhorin Academy",
                 summary="8-week offline bootcamp — build and deploy 3 projects.",
                 description="Evening classes in our Dhaka lab. Small batches, project reviews, mock interviews and a "
                             "Sonarhorin certificate on completion.",
                 location="Dhaka (Mirpur)", mode="offline", duration="8 weeks · 3 evenings/week", fee="৳6,000", seats=25,
                 majors="", requirements=["Laptop", "Basic programming"],
                 curriculum=["Python & Django", "REST APIs", "React", "Deployment", "Interview prep"],
                 perks=["Certificate", "Mock interviews", "Job referrals"], start=21, deadline=14),
            dict(kind="training", title="Corporate Readiness Workshop", organization="Sonarhorin Academy",
                 summary="2-day offline workshop: CV, email, Excel, presentation and interview etiquette.",
                 description="Everything universities don't teach about your first office job.",
                 location="Dhaka (Dhanmondi)", mode="offline", duration="2 days", fee="Free", seats=40, majors="",
                 requirements=["Final-year students & fresh graduates"],
                 curriculum=["CV & LinkedIn clinic", "Professional email", "Excel essentials", "Presentation", "Mock interview"],
                 perks=["Certificate", "Lunch"], start=10, deadline=7),
            dict(kind="training", title="Excel & Power BI for Business Freshers", organization="Sonarhorin Academy",
                 summary="4-week hands-on data course for BBA and non-tech graduates.",
                 description="From VLOOKUP to dashboards — work on real business datasets.",
                 location="Chattogram", mode="offline", duration="4 weeks · weekends", fee="৳3,500", seats=30,
                 majors="", requirements=["Laptop with Excel"], curriculum=["Formulas", "Pivot tables", "Power BI dashboards"],
                 perks=["Certificate"], start=18, deadline=12),
        ]
        for p in programs:
            start, deadline = p.pop("start"), p.pop("deadline")
            Program.objects.update_or_create(title=p["title"], defaults={
                **p, "start_date": today + timedelta(days=start), "deadline": today + timedelta(days=deadline)})
        self.stdout.write(self.style.SUCCESS(f"Programs: {Program.objects.count()}"))

        tests = [
            dict(title="Sonarhorin Verified Efficiency Test", company_name="", description="General test for any fresher: your major + aptitude + workplace communication. Proctored, one attempt.",
                 major="", question_count=15, seconds_per_question=60, require_webcam=False),
            dict(title="Junior Software Engineer — Entry Test", company_name="Nodi Labs (demo)", description="Pre-joining test for junior developer candidates.",
                 major="CSE", question_count=12, seconds_per_question=75, require_webcam=True),
            dict(title="Management Trainee — Entry Test", company_name="Padma Pay (demo)", description="Pre-joining test for MTO candidates.",
                 major="BBA", question_count=12, seconds_per_question=60, require_webcam=False),
        ]
        for t in tests:
            EfficiencyTest.objects.update_or_create(title=t["title"], defaults=t)
        self.stdout.write(self.style.SUCCESS(f"Efficiency tests: {EfficiencyTest.objects.count()}"))

        # Sample success stories — flagged is_demo so the site labels them "Sample". Replace with real ones.
        samples = [
            dict(name="Tania R.", major="BBA", university="National University (Dhaka College)", city="Dhaka", role="Management Trainee Officer", company="Padma Pay (demo)",
                 quote="আট মাস ধরে শুধু 'আমরা জানাব' শুনেছি। সিভি রিপোর্ট দেখে বুঝলাম আমার সিভিতে একটা সংখ্যাও নেই। ঠিক করার তিন সপ্তাহ পর প্রথম ইন্টারভিউ।",
                 months_jobless=8, applications_before=63, days_to_hire=41, cv_score_before=38, cv_score_after=84, tests_passed=2),
            dict(name="Arif H.", major="CSE", university="IUBAT", city="Dhaka", role="Junior Software Engineer", company="Nodi Labs (demo)",
                 quote="Every job ad wanted 2 years of experience. The efficiency test certificate was the first thing that made an employer call me back.",
                 months_jobless=5, applications_before=47, days_to_hire=29, cv_score_before=52, cv_score_after=88, tests_passed=3),
            dict(name="Mitali D.", major="EEE", university="RUET", city="Rajshahi", role="Graduate Engineer Trainee", company="Shapla Power (demo)",
                 quote="রাজশাহী থেকে ঢাকার কোনো কোম্পানিতে পরিচিত কেউ ছিল না। এআই ইন্টারভিউ দশবার প্র্যাকটিস করেছি — আসল ইন্টারভিউতে আর ভয় লাগেনি।",
                 months_jobless=11, applications_before=58, days_to_hire=52, cv_score_before=44, cv_score_after=79, tests_passed=2),
            dict(name="Sabbir K.", major="Textile", university="BUTEX", city="Gazipur", role="Merchandiser Trainee", company="Doyel Apparels (demo)",
                 quote="The offline training gave me the one project my CV was missing. I put the certificate link on my CV and got two interview calls.",
                 months_jobless=6, applications_before=34, days_to_hire=35, cv_score_before=49, cv_score_after=81, tests_passed=1),
            dict(name="Nusrat J.", major="English", university="Jahangirnagar University", city="Savar", role="Content Writer", company="Kolom Media (demo)",
                 quote="বাসায় সবাই বলত ইংরেজিতে পড়ে কী হবে। এখন আমি কনটেন্ট টিমে — আর মা সবাইকে আমার লেখা পাঠায়।",
                 months_jobless=7, applications_before=41, days_to_hire=33, cv_score_before=55, cv_score_after=86, tests_passed=2),
            dict(name="Rahim U.", major="Pharmacy", university="University of Chittagong", city="Chattogram", role="QC Officer Trainee", company="Megh Pharma (demo)",
                 quote="I failed my first two mock interviews with Mitu. The feedback told me exactly what to fix about GMP answers. Third real interview: hired.",
                 months_jobless=9, applications_before=52, days_to_hire=46, cv_score_before=41, cv_score_after=77, tests_passed=1),
        ]
        for st in samples:
            SuccessStory.objects.update_or_create(name=st["name"], is_demo=True, defaults={**st, "status": "approved", "consent": True, "featured": st["name"] in ("Tania R.", "Arif H.")})
        self.stdout.write(self.style.SUCCESS(f"Sample stories: {SuccessStory.objects.filter(is_demo=True).count()}"))

        # Sample companies + jobs (all marked "(demo)") covering the three apply channels
        comps = [
            ("Nodi Labs (demo)", dict(industry="Software", color="#FFC23D", is_partner=True)),
            ("Padma Pay (demo)", dict(industry="Fintech", color="#7CC4FF", is_partner=True)),
            ("Shapla Systems (demo)", dict(industry="Software", color="#FFB86B", apply_email="careers@shapla-systems.example")),
            ("Kolom Media (demo)", dict(industry="Media", color="#FF8FB1", apply_email="hr@kolom-media.example")),
            ("Doyel Apparels (demo)", dict(industry="RMG / Textile", color="#B9A6FF", city="Gazipur", careers_url="https://doyel-apparels.example/careers")),
            ("Megh Pharma (demo)", dict(industry="Pharmaceuticals", color="#B9A6FF", city="Chattogram", careers_url="https://megh-pharma.example/careers")),
            ("Shapla Power (demo)", dict(industry="Power & Energy", color="#E8B634", careers_url="https://shapla-power.example/jobs")),
        ]
        C = {}
        for name, extra in comps:
            C[name], _ = Company.objects.update_or_create(name=name, defaults=extra)
        J = [
            ("Nodi Labs (demo)", "Junior Software Engineer", "CSE", "full_time", "Dhaka (Banani)", 30000, 38000, "partner", ["Python or JavaScript", "Git", "REST APIs"], False),
            ("Nodi Labs (demo)", "Frontend Developer Intern", "CSE", "internship", "Remote", 15000, 20000, "partner", ["React", "HTML/CSS"], True),
            ("Padma Pay (demo)", "Management Trainee Officer", "BBA", "trainee", "Dhaka (Gulshan)", 40000, 45000, "partner", ["Excel", "Communication", "Analytical thinking"], False),
            ("Padma Pay (demo)", "QA Engineer (Fresher)", "CSE", "full_time", "Dhaka (Gulshan)", 27000, 33000, "partner", ["Testing basics", "SQL"], False),
            ("Shapla Systems (demo)", "Trainee ML Engineer", "CSE,EEE", "trainee", "Dhaka", 28000, 35000, "email", ["Python", "Machine learning", "Statistics"], False),
            ("Shapla Systems (demo)", "Data Analyst Trainee", "CSE,BBA,Other", "trainee", "Hybrid · Dhaka", 25000, 30000, "email", ["Excel", "SQL", "Power BI"], False),
            ("Kolom Media (demo)", "Content Writer (Bangla & English)", "English,Other", "full_time", "Dhaka", 20000, 26000, "email", ["Writing", "SEO basics"], False),
            ("Kolom Media (demo)", "Social Media Executive", "BBA,English", "full_time", "Dhaka", 22000, 28000, "email", ["Canva", "Copywriting", "Analytics"], False),
            ("Doyel Apparels (demo)", "Merchandiser Trainee", "Textile,BBA", "trainee", "Gazipur", 24000, 30000, "portal", ["Merchandising", "Buyer communication"], False),
            ("Megh Pharma (demo)", "QC Officer Trainee", "Pharmacy", "trainee", "Chattogram", 26000, 32000, "portal", ["GMP", "HPLC basics"], False),
            ("Shapla Power (demo)", "Graduate Engineer Trainee — Electrical", "EEE", "trainee", "Dhaka & site", 32000, 40000, "portal", ["Power systems", "AutoCAD", "Safety"], False),
        ]
        for comp, title, majors, jt, loc, smin, smax, ch, reqs, remote in J:
            c = C[comp]
            Job.objects.update_or_create(company=c, title=title, defaults=dict(
                majors=majors, job_type=jt, location=loc, salary_min=smin, salary_max=smax, apply_channel=ch, requirements=reqs,
                remote=remote, experience_max_years=0, source="partner" if ch == "partner" else "admin", is_active=True,
                description=f"{c.name} is hiring a {title}. Fresh graduates welcome — no experience required. You'll get training, a mentor and real work from week one.",
                apply_url=(c.careers_url + "/" + title.lower().replace(" ", "-")[:40]) if ch == "portal" else "",
                deadline=today + timedelta(days=14 + len(title) % 20)))
        self.stdout.write(self.style.SUCCESS(f"Sample jobs: {Job.objects.filter(company__name__endswith='(demo)').count()}"))

        if opts["demo_user"] and not User.objects.filter(email="demo@prothom.dev").exists():
            User.objects.create_user("demo@prothom.dev", "Prothom@2026", full_name="Demo Fresher", major="CSE",
                                     university="IUBAT", graduation_year=2026)
            self.stdout.write(self.style.SUCCESS("Demo user: demo@prothom.dev / Prothom@2026"))
        demo = User.objects.filter(email="demo@prothom.dev").first() if opts["demo_user"] else None
        if demo and not demo.cv_analyses.exists():
            # a sample CV so the demo account can try 1-tap / email apply straight away
            from django.core.files.base import ContentFile

            from apps.cv import analyzer
            from apps.cv.models import CVAnalysis

            text = DEMO_CV
            demo.phone, demo.skills, demo.cgpa = demo.phone or "+880 1700 000000", demo.skills or "Python, Django, React, SQL, Git", demo.cgpa or 3.55
            demo.save(update_fields=["phone", "skills", "cgpa"])
            rep = analyzer.analyze(text, 1, demo.major)
            cv = CVAnalysis(user=demo, original_name="Demo_Fresher_CV.txt", major=demo.major, extracted_text=text,
                            score=rep["score"], rejection_probability=rep["rejection_probability"], report=rep)
            cv.file.save("Demo_Fresher_CV.txt", ContentFile(text.encode()), save=True)
            self.stdout.write(self.style.SUCCESS("Demo user: sample CV added"))
        if demo:
            self._seed_network(demo)


DEMO_CV = """Demo Fresher
Dhaka, Bangladesh | +880 1700 000000 | demo@prothom.dev
linkedin.com/in/demo-fresher | github.com/demo-fresher

Objective
Fresh CSE graduate looking for a junior software engineering role where I can ship real features from week one.

Education
BSc in Computer Science and Engineering, IUBAT - CGPA 3.55 (2026)

Skills
Python, Django, React, SQL, Git, REST APIs

Projects
Campus food ordering app with React and Django REST Framework, used by 300+ students; cut queue time by 40%.
Bangla news classifier in Python and scikit-learn with 91% accuracy.

Experience
Software intern, local startup (3 months) - built 6 API endpoints and wrote unit tests.
"""


SAMPLE_PEOPLE = [
    ("Tasnim Ahmed", "CSE", "IUBAT", 2026, "Learning Django · looking for a junior backend role"),
    ("Rakib Hossain", "CSE", "NSU", 2025, "Frontend intern · React & Tailwind"),
    ("Mim Akter", "BBA", "IUBAT", 2026, "Finance major · MTO prep"),
    ("Joy Sarkar", "EEE", "RUET", 2025, "Power systems · GET applicant"),
    ("Sadia Islam", "English", "JU", 2026, "Content writer · Bangla & English"),
    ("Nayeem Khan", "CSE", "IUBAT", 2026, "Building an edtech startup idea"),
]
SAMPLE_ROOM = [
    ("general", 0, "Kalke Padma Pay er MTO exam ta kemon holo karo? Aptitude part ta tough chilo naki?"),
    ("general", 2, "Amar holo — math easy chilo, but time kom. Shortcut practice koro."),
    ("cse", 1, "Junior SE interview e 'reverse a linked list' + one React question dise. Easy chilo 🙂"),
    ("cse", 0, "Thanks! Ami Quick Test e 80% paisi, certificate ta CV te add korlam."),
    ("interviews", 3, "Tip: 'Tell me about yourself' er answer 60 second e practice koro AI interviewer diye."),
    ("startup", 5, "Keu co-founder khujle knock dio — edtech idea, need a BBA person for sales."),
]


def _seed_network(self, demo):
    """Sample people + chat so the Network page isn't empty in the demo. Emails end with @sample.sonarhorin — delete before launch."""
    from apps.network.models import Connection, Message

    if Message.objects.filter(sender__email__endswith="@sample.sonarhorin").exists():
        return
    people = []
    for i, (n, m, uni, y, h) in enumerate(SAMPLE_PEOPLE):
        u, _ = User.objects.get_or_create(email=f"sample{i + 1}@sample.sonarhorin", defaults=dict(
            full_name=n, major=m, university=uni, graduation_year=y, headline=f"{h} · sample profile"))
        u.set_unusable_password(); u.save()
        people.append(u)
    for room, who, text in SAMPLE_ROOM:
        Message.objects.create(sender=people[who], room=room, text=text)
    Connection.objects.get_or_create(from_user=people[0], to_user=demo, defaults={"status": "accepted"})
    Connection.objects.get_or_create(from_user=people[5], to_user=demo, defaults={"status": "pending", "note": "Startup idea niye kotha bolte chai!"})
    Message.objects.create(sender=people[0], recipient=demo, text="Hi! Tumi o IUBAT CSE? Nodi Labs e apply korecho?")
    self.stdout.write(self.style.SUCCESS("Sample network: 6 people, room messages"))


Command._seed_network = _seed_network
