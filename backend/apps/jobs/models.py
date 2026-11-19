from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

CHANNELS = [
    ("partner", "1-click (partner employer)"),
    ("email", "Email apply"),
    ("portal", "Company career portal (assisted)"),
]
JOB_TYPES = [("full_time", "Full-time"), ("trainee", "Trainee / MTO"), ("internship", "Internship"), ("part_time", "Part-time")]


class Company(models.Model):
    ATS = [("none", "None"), ("custom", "Own career site"), ("bdjobs", "Bdjobs"), ("greenhouse", "Greenhouse"), ("lever", "Lever"),
           ("workday", "Workday"), ("other", "Other")]
    name = models.CharField(max_length=140, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    website = models.URLField(blank=True)
    careers_url = models.URLField(blank=True, help_text="Public careers page (used by `import_jobs`).")
    industry = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=60, blank=True, default="Dhaka")
    color = models.CharField(max_length=7, default="#FFC23D")
    is_partner = models.BooleanField(default=False, help_text="Receives applications directly inside Sonarhorin (1-click).")
    logo = models.ImageField(upload_to="logos/", blank=True, help_text="Square or wide PNG/SVG-like logo on a transparent background.")
    featured = models.BooleanField(default=False, help_text="Pin to the front of the Featured Companies strip.")
    apply_email = models.EmailField(blank=True, help_text="Default HR inbox for email-apply jobs.")
    ats = models.CharField(max_length=12, choices=ATS, default="custom")
    employer_users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="companies",
                                            help_text="Employer accounts that can see applicants.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Companies"

    def save(self, *a, **kw):
        if not self.slug:
            self.slug = slugify(self.name)[:150] or f"company-{timezone.now().timestamp():.0f}"
        super().save(*a, **kw)

    def __str__(self):
        return self.name


class Job(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="jobs")
    title = models.CharField(max_length=160)
    location = models.CharField(max_length=100, default="Dhaka")
    job_type = models.CharField(max_length=12, choices=JOB_TYPES, default="full_time")
    remote = models.BooleanField(default=False)
    majors = models.CharField(max_length=120, blank=True, help_text="Comma separated, blank = any major")
    experience_max_years = models.PositiveSmallIntegerField(default=0, help_text="0–1 = fresher friendly")
    salary_min = models.PositiveIntegerField(null=True, blank=True, help_text="BDT / month")
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    requirements = models.JSONField(default=list, blank=True)
    apply_channel = models.CharField(max_length=8, choices=CHANNELS, default="portal")
    apply_url = models.URLField(blank=True, help_text="Career-portal link for portal jobs")
    apply_email = models.EmailField(blank=True, help_text="Overrides the company inbox for email jobs")
    source = models.CharField(max_length=10, choices=[("partner", "Posted by partner"), ("admin", "Added by admin"), ("import", "Imported from careers page")], default="admin")
    source_url = models.URLField(blank=True)
    external_id = models.CharField(max_length=200, blank=True)
    posted_at = models.DateTimeField(default=timezone.now)
    deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    # Scam / fake-job detector (apps/jobs/trust.py). Recomputed on every save; backfill with `check_job_trust`.
    trust_level = models.CharField(max_length=8, default="ok", db_index=True,
                                   choices=[("verified", "Verified"), ("ok", "OK"), ("caution", "Caution"), ("danger", "Likely scam")])
    trust_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="0–100, higher is safer")
    trust_reasons = models.JSONField(default=list, blank=True)
    trust_checked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-posted_at"]
        constraints = [models.UniqueConstraint(fields=["company", "external_id"], condition=~models.Q(external_id=""), name="uniq_job_external_id")]

    def __str__(self):
        return f"{self.title} — {self.company}"

    @property
    def major_list(self):
        return [m.strip() for m in self.majors.split(",") if m.strip()]

    @property
    def inbox(self):
        return self.apply_email or self.company.apply_email

    @property
    def is_open(self):
        return self.is_active and (self.deadline is None or self.deadline >= timezone.localdate())

    TRUST_INPUTS = {"title", "description", "requirements", "company", "company_id", "apply_email", "apply_url", "location",
                    "salary_min", "salary_max", "experience_max_years"}
    TRUST_FIELDS = ["trust_level", "trust_score", "trust_reasons", "trust_checked_at"]

    def save(self, *a, **kw):
        """Score the post with the rule-based scam detector (fast, offline) before every content save."""
        fields = kw.get("update_fields")
        if fields is None or self.TRUST_INPUTS & set(fields):
            from . import trust
            try:
                trust.apply_to(self, trust.assess_job(self))
                if fields is not None:
                    kw["update_fields"] = list({*fields, *self.TRUST_FIELDS})
            except Exception:  # a detector bug must never block saving a job
                import logging
                logging.getLogger(__name__).exception("trust check failed for job %s", self.pk)
        super().save(*a, **kw)

    def effective_channel(self):
        """What actually happens when someone applies."""
        if self.apply_channel == "partner" and self.company.is_partner:
            return "partner"
        if self.apply_channel in ("partner", "email") and self.inbox:
            return "email"
        return "portal"


class AutoApplySettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="auto_apply")
    enabled = models.BooleanField(default=False)
    majors = models.CharField(max_length=120, blank=True, help_text="Blank = my own major")
    locations = models.CharField(max_length=200, blank=True, help_text="Comma separated, blank = anywhere")
    job_types = models.CharField(max_length=80, blank=True, default="full_time,trainee,internship")
    min_salary = models.PositiveIntegerField(null=True, blank=True)
    remote_only = models.BooleanField(default=False)
    max_per_day = models.PositiveSmallIntegerField(default=5)
    channels = models.CharField(max_length=40, default="partner,email", help_text="Auto-apply never submits to portals.")
    note = models.TextField(blank=True, max_length=600, help_text="A personal line added to every cover letter.")
    last_run = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Auto-apply for {self.user} ({'on' if self.enabled else 'off'})"


class JobApplication(models.Model):
    STATUS = [
        ("submitted", "Submitted to employer"),
        ("sent", "Emailed to HR"),
        ("needs_action", "Finish on company portal"),
        ("done", "Submitted on portal"),
        ("failed", "Failed"),
        ("withdrawn", "Withdrawn"),
        ("shortlisted", "Shortlisted"),
        ("interview", "Interview"),
        ("rejected", "Not selected"),
        ("hired", "Hired"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications")
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    channel = models.CharField(max_length=8, choices=CHANNELS)
    status = models.CharField(max_length=14, choices=STATUS)
    auto = models.BooleanField(default=False, help_text="Sent by auto-apply")
    cover_letter = models.TextField(blank=True)
    cv = models.ForeignKey("cv.CVAnalysis", null=True, blank=True, on_delete=models.SET_NULL)
    error = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["user", "job"], name="uniq_user_job_application")]

    def __str__(self):
        return f"{self.user} → {self.job} ({self.status})"


class ScamReport(models.Model):
    """A user flagging a job as fake / asking for money. 3+ distinct reporters → the job drops to "caution"."""

    REASONS = [("asked_money", "Asked me to pay a fee / deposit"), ("fake_company", "Company doesn't exist / fake"),
               ("personal_info", "Asked for OTP / NID / bank details"), ("chat_only", "Only WhatsApp / Telegram contact"),
               ("misleading", "Misleading salary or role"), ("other", "Other")]
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="scam_reports")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scam_reports")
    reason = models.CharField(max_length=16, choices=REASONS, default="other")
    details = models.TextField(blank=True, max_length=1000)
    resolved = models.BooleanField(default=False, help_text="Reviewed by staff")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["job", "user"], name="uniq_scam_report_per_user")]

    def __str__(self):
        return f"Scam report on {self.job_id} by {self.user_id} ({self.reason})"
