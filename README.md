# Radar de Preços Agro BA

Dashboard of agricultural price quotations collected from the SEAGRI Bahia public listing. It stores quotations in PostgreSQL, exposes them through a FastAPI service, and shows averages, ranges, and market movements in a Next.js interface.

The data source is the SEAGRI quotation page at `https://www.ba.gov.br/seagri/cotacao`. The collector reads the published HTML tables. It does not use a private API.

## Features

- Historical load of the last 365 days when the API container starts.
- Daily collection of the last 24 hours, and a monthly cleanup of the oldest 30-day window.
- REST endpoints for products, markets (`praças`), summary statistics, time series, and price rankings.
- Dashboard with product and market filters, a date range, summary figures, a price chart, a market comparison, a ranking of rises and falls, and CSV export.
- The browser calls the Next.js route `/agro-api`, which proxies requests to the FastAPI service.

The API does not implement authentication or authorization.

## Technologies

- Backend: Python 3.12, FastAPI, Uvicorn, SQLAlchemy, psycopg, pandas, Beautiful Soup, requests
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts
- Database: PostgreSQL 17
- Containers: Docker Compose, with cron in the scheduler container

There is no migration tool such as Alembic. Tables are created with SQLAlchemy `create_all`.

## Architecture

```text
Browser
  -> Next.js (port 3000)
       -> /agro-api proxy
            -> FastAPI (port 8080)
                 -> PostgreSQL schema cotacoes
SEAGRI HTML
  -> collector jobs (backfill, daily, monthly)
       -> same PostgreSQL schema
```

Inside Compose, the frontend reaches the API at `http://backend:8080`. The API and the scheduler reach PostgreSQL at the hostname `db`.

The backend image command creates tables, runs the historical backfill, and only then starts Uvicorn. The API port stays closed until that backfill finishes. The scheduler uses the same image but a different command, so it does not create tables or run the backfill.

## Project structure

```text
backend/app/api/            FastAPI routes, schemas, services, repositories
backend/app/collector/      SEAGRI client, parser, normalizer, and jobs
backend/app/db/             Engine, session, and table creation
backend/app/models/         SQLAlchemy models
backend/crontab             Scheduler timetable
backend/scheduler-entrypoint.sh
frontend/app/               Next.js pages and the /agro-api proxy
frontend/components/dashboard/
compose.yml                 frontend, backend, scheduler, and db
docs/scheduler.md           Scheduler operations
```

Python modules are imported as `backend.app...`. Commands that use `python -m` must be run from the repository root, so that directory is on the module path.

## Prerequisites

- Python 3.12
- Node.js 22 (the version used by the frontend image; Next.js 16 requires Node.js 20.9 or newer)
- PostgreSQL 17, or Docker with Docker Compose

## Configuration

Copy the variable names below into local files. Do not commit real passwords.

Repository root `.env`, read by Docker Compose:

```text
POSTGRES_DB=agrodata
POSTGRES_USER=agrodata
POSTGRES_PASSWORD=replace-with-a-password
```

Compose builds the container database URL itself:

```text
postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

For a backend process running on the host, set `DATABASE_URL` before starting Python. `backend/app/db/session.py` loads it with `python-dotenv` and fails at import time if it is missing. Point the host at `localhost` when PostgreSQL is published on port 5432:

```text
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/DATABASE
```

Frontend `frontend/.env.local`, used by `npm run dev` and by the production server outside Compose:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

The Compose frontend build sets `NEXT_PUBLIC_API_URL` to `http://backend:8080`. That value is for the Next.js server, not for the browser. The browser keeps calling `/agro-api`.

The scheduler also receives `TZ=America/Bahia`. The timetable itself uses `CRON_TZ=America/Bahia` in `backend/crontab`.

## Run with Docker

From the repository root, with the `.env` file described above:

```bash
docker compose build backend
docker compose up --build
```

The scheduler image is `agrodata-ba-backend`, built by the backend service.

| Service    | URL or address                         |
| ---------- | -------------------------------------- |
| Frontend   | http://localhost:3000                  |
| API        | http://localhost:8080                  |
| API docs   | http://localhost:8080/docs             |
| PostgreSQL | `localhost:5432`                       |

The backend container runs, in order:

```bash
python -m backend.app.db.init_db
python -m backend.app.collector.jobs.backfill
uvicorn backend.app.api.main:app --host 0.0.0.0 --port 8080
```

The backfill requests about one year of quotations and waits between pages. Expect the API to stay unavailable until that command exits successfully.

Logs:

```bash
docker compose logs -f backend
docker compose logs -f scheduler
docker compose logs -f frontend
```

## Run locally

Start PostgreSQL first and export `DATABASE_URL`.

```bash
python -m venv backend/.venv
```

Windows PowerShell:

```powershell
backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python -m backend.app.db.init_db
python -m backend.app.api.main
```

The API listens on `0.0.0.0:8080`. Interactive OpenAPI is at http://127.0.0.1:8080/docs.

In another shell:

```bash
cd frontend
npm ci
npm run dev
```

The dashboard is at http://localhost:3000. Other frontend scripts are `npm run build`, `npm run start`, and `npm run lint`.

A local historical load is optional:

```bash
python -m backend.app.collector.jobs.backfill
```

Run it from the repository root, with `DATABASE_URL` set. It is not required for the API process to start.

## API

All routes are `GET`. Repeated query keys are used for lists (`produto_ids`, `pracas_ids`).

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/produtos/` | Products. Optional `limit` and `offset`. |
| GET | `/pracas/` | Markets. Optional `limit` and `offset`. |
| GET | `/estatisticas/` | Average, median, min, max, count, market count, and percent change. |
| GET | `/estatisticas/preco-medio-por-data` | Average price by date. |
| GET | `/estatisticas/preco-medio-por-praca` | Average price by market. |
| GET | `/estatisticas/dados-por-praca` | Average, min, and max by market. |
| GET | `/estatisticas/maiores-altas-e-quedas` | Largest rises and falls by market. |
| GET | `/cotacoes/estatisticas` | Statistics for one required `produto_id`. |

The statistics and quotation routes accept optional `pracas_ids`, `start_date`, and `end_date` (`YYYY-MM-DD`). The `/estatisticas` routes also accept optional `produto_ids`. Dates and ids are UUIDs generated by the database models.

FastAPI publishes the same contract at `/docs` and `/openapi.json`.

## Database

PostgreSQL schema `cotacoes`:

| Table | Role |
| ----- | ---- |
| `produtos` | Product name, unique. |
| `produto_tipos` | Product variety. Belongs to one product. Unique on name plus product. |
| `pracas` | Market name, unique. |
| `cotacoes` | One price for a date, market, and product type. Unique on those three columns. |

`python -m backend.app.db.init_db` creates the schema and any missing tables. It does not drop existing tables. `drop_tables()` exists in `backend/app/db/init_db.py` but is not called on startup.

Duplicate quotations are ignored on insert. The monthly job deletes quotations from the oldest date through the following 30 days.

## Scheduler

The `scheduler` service starts with the stack and waits. It does not run a job at startup, and it does not rerun a job that was missed while the container was stopped.

| Job | Module | When |
| --- | ------ | ---- |
| Daily | `backend.app.collector.jobs.daily` | Every day at 00:00 |
| Monthly | `backend.app.collector.jobs.monthly` | Day 1 of each month at 00:30 |

Timezone: `America/Bahia`.

On the first day of the month the daily job can still be running when the monthly delete starts. Both write to the same tables. Details, log commands, and how to change the timetable are in [docs/scheduler.md](docs/scheduler.md).

## Tests

No automated test suite is configured. The frontend can be linted with:

```bash
cd frontend
npm run lint
```
