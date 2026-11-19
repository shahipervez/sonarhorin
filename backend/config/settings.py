"""Sonarhorin (সোনারহরিণ) — Django settings."""
import os
import sys
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    return os.getenv(name, str(default)).lower() in ("1", "true", "yes", "on")


DEBUG = env_bool("DJANGO_DEBUG", True)
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me-in-production")
if not DEBUG and (SECRET_KEY.startswith("dev-only") or len(SECRET_KEY) < 40):
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured("Set a long random DJANGO_SECRET_KEY before running with DJANGO_DEBUG=False.")
# Comma-separated; render.yaml uses ALLOWED_HOSTS, .env.example uses DJANGO_ALLOWED_HOSTS. "*" only as a fallback.
ALLOWED_HOSTS = [h.strip() for h in (os.getenv("DJANGO_ALLOWED_HOSTS") or os.getenv("ALLOWED_HOSTS") or "*").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # sonarhorin apps
    "apps.accounts",
    "apps.core",
    "apps.cv",
    "apps.assessments",
    "apps.interviews",
    "apps.programs",
    "apps.certifications",
    "apps.stories",
    "apps.jobs",
    "apps.portfolio",
    "apps.network",
    "apps.startups",
    "apps.career",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "apps.core.security.SecurityHeadersMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# SQLite for development. Set DATABASE_URL-style vars below for PostgreSQL in production.
if os.getenv("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER", "postgres"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
# Argon2id first; older hashes still verify and are upgraded on next login.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
# CVs, resumes and pitch decks live here — never served publicly, only through owner-checked API views.
PRIVATE_MEDIA_ROOT = Path(os.getenv("PRIVATE_MEDIA_ROOT", BASE_DIR / "private"))
if len(sys.argv) > 1 and sys.argv[1] == "test":  # test uploads must never land in (or get committed from) backend/private
    import tempfile

    PRIVATE_MEDIA_ROOT = Path(tempfile.mkdtemp(prefix="sonarhorin-test-private-"))
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    # Stricter per-endpoint limits: set `throttle_classes = STRICT` (apps.core.throttles) + `throttle_scope` on the view.
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.UserRateThrottle", "rest_framework.throttling.AnonRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "user": "3000/hour", "anon": os.getenv("ANON_RATE", "1500/hour"),
        "login": "10/min", "register": "8/hour", "ai": os.getenv("AI_RATE", "60/hour"), "upload": "40/hour",
        # OTP send/verify (phone login) — keep SMS cost + brute force of 6-digit codes in check.
        "otp": os.getenv("OTP_RATE", "5/hour"), "otp_verify": "10/hour", "social_login": "20/hour",
        "report": "20/day", "scrape": "4/hour",
    },
}

# Short-lived access token (kept in memory by the SPA) + rotating refresh token in an HttpOnly cookie.
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}
REFRESH_COOKIE = {
    "key": "sh_refresh",
    "path": "/api/auth/",
    "httponly": True,
    "secure": True,
    "samesite": "None",
}
LOGIN_MAX_FAILS = 5          # per email + per IP …
LOGIN_LOCK_MINUTES = 15      # … then locked for this long
TRUST_X_FORWARDED_FOR = env_bool("TRUST_X_FORWARDED_FOR", False)

# Reflecting *every* origin together with CORS_ALLOW_CREDENTIALS lets any website read authenticated API responses.
# Default: only in DEBUG. Production should list its frontend(s) in CORS_ALLOWED_ORIGINS (see SECURITY_REVIEW.md).
CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", DEBUG)
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# ---- HTTP security headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = env_bool("COOKIE_SECURE", True)
    CSRF_COOKIE_SECURE = env_bool("COOKIE_SECURE", True)
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
if os.getenv("REDIS_URL"):
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": os.getenv("REDIS_URL")}}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"plain": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "plain"}},
    "loggers": {"security": {"handlers": ["console"], "level": "INFO"}, "apps": {"handlers": ["console"], "level": "INFO"}},
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 2000
FILE_UPLOAD_PERMISSIONS = 0o640  # uploaded CVs are not world-readable on the server

# ---- Sonarhorin settings ----
DISCORD_INVITE_URL = os.getenv("DISCORD_INVITE_URL", "https://discord.gg/your-invite-code")
SITE_URL = os.getenv("SITE_URL", "http://localhost:5173")

# Optional AI. Everything works without a key (built-in rule engines); with a key, CV feedback
# and the interviewer become LLM-powered.
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
AI_MAX_INPUT_CHARS = 24000   # resume / job text is truncated to this before it reaches the model

QUICK_TEST_QUESTIONS = 10
QUICK_TEST_MINUTES = 10
QUICK_TEST_PASS_PERCENT = 70
INTERVIEW_MINUTES = 10

# ---- Email (used by "email apply"). Console in development; set SMTP vars in production.
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Sonarhorin Apply <apply@sonarhorin.com>")
