FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends cron tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/run

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./backend

RUN crontab /app/backend/crontab

EXPOSE 8080

CMD ["sh", "-c", "python -m backend.app.db.init_db && python -m backend.app.collector.jobs.backfill && exec uvicorn backend.app.api.main:app --host 0.0.0.0 --port 8080"]
