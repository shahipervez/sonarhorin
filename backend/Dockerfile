FROM python:3.12-slim

WORKDIR /app

# Install system deps including sqlite3 and libsqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    sqlite3 \
    libsqlite3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Environment for build
ENV DJANGO_SECRET_KEY="temporary-secret-for-docker-build-only-change-at-runtime"
ENV DJANGO_DEBUG="true"

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8080

# Run migrations, seed data, and start gunicorn
CMD python manage.py migrate --noinput && \
    python manage.py seed_data || true && \
    exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 120
