from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

MAJOR_CHOICES = [
    ("CSE", "Computer Science & Engineering"),
    ("EEE", "Electrical & Electronic Engineering"),
    ("BBA", "Business Administration"),
    ("English", "English"),
    ("Pharmacy", "Pharmacy"),
    ("Textile", "Textile Engineering"),
    ("Other", "Other"),
]


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self._create_user(email, password, **extra)


class User(AbstractUser):
    """Login with email. Freshers keep their major so tests/interviews adapt to them."""

    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)
    major = models.CharField(max_length=20, choices=MAJOR_CHOICES, default="CSE")
    university = models.CharField(max_length=160, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)
    cgpa = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    skills = models.TextField(blank=True, help_text="Comma separated")
    linkedin = models.URLField(blank=True)
    github = models.URLField(blank=True)
    TRACKS = [("job", "First job"), ("internship", "Internship"), ("startup", "Startup")]
    track = models.CharField(max_length=12, choices=TRACKS, default="job", help_text="What the user is looking for — changes the dashboard layout.")
    headline = models.CharField(max_length=140, blank=True, help_text="One line shown on the network and the portfolio site.")
    is_employer = models.BooleanField(default=False, help_text="Employers can see efficiency-test results of their invites.")
    # ---- set by third-party sign-in (Google / phone OTP), see apps/accounts/integrations.py
    phone_e164 = models.CharField(max_length=16, unique=True, null=True, blank=True, help_text="Verified BD mobile number in +8801XXXXXXXXX form (set by OTP login).")
    phone_verified = models.BooleanField(default=False)
    google_sub = models.CharField(max_length=64, unique=True, null=True, blank=True, help_text="Google account id linked via Google Sign-In.")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} <{self.email}>"


class PhoneOTP(models.Model):
    """One-time login code sent by SMS. Only a salted HMAC of the code is stored."""

    phone = models.CharField(max_length=16, db_index=True)  # +8801XXXXXXXXX
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used_at = models.DateTimeField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["phone", "-created_at"])]

    def __str__(self):
        return f"OTP {self.phone[:6]}… @ {self.created_at:%Y-%m-%d %H:%M}"
