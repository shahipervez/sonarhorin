# Sonarhorin API — Django + Gunicorn (gthread workers so the streaming coach chat doesn't block others)
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 10001 app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN mkdir -p /app/media /app/private /app/staticfiles && chown -R app:app /app
USER app
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --threads 8 --worker-class gthread --timeout 150 --access-logfile -"]
