# Kalk — CGPA calculator

Upload results as PDF / DOCX / TXT / CSV, exclude electives, get your CGPA on the Nigerian 5.0 scale.

- `backend/` — FastAPI (auth, upload parsing, CGPA maths). SQLite by default, Postgres in Docker.
- `frontend/` — Next.js 14 (landing, log in / sign up, dashboard).

## Run with Docker (one command)

```bash
cp .env.example .env        # then set SECRET_KEY (and optionally GOOGLE_CLIENT_ID)
docker compose up --build
```

Web: http://localhost:3000 · API docs: http://localhost:8000/docs

To deploy on a server, set `PUBLIC_API_URL` and `CORS_ORIGINS` in `.env` to your real URLs **before** building —
the API URL is baked into the frontend bundle at build time.

## Run without Docker

```bash
# API
cd backend && python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
SECRET_KEY=dev-secret-at-least-32-characters-long uvicorn app.main:app --reload

# Web (second terminal)
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

## Configuration

| Variable | Used by | Purpose |
|---|---|---|
| `SECRET_KEY` | api | Signs login tokens. Required in Docker. |
| `DATABASE_URL` | api | Defaults to `sqlite:///./cgpa.db`; Docker uses Postgres. |
| `GOOGLE_CLIENT_ID` | api + web | Enables "Continue with Google". Leave empty to hide it. |
| `CORS_ORIGINS` | api | Comma-separated site origins allowed to call the API. |
| `MAX_UPLOAD_MB` | api | Per-file upload limit (default 10). |
| `NEXT_PUBLIC_API_URL` | web | API address as seen from the browser. |

## Tests

```bash
cd backend && pytest
```

## Notes

- Result sheets differ between schools, so parsing is heuristic. Rows with missing units or grade are flagged "Check this" and not counted until fixed.
- Back up the `pgdata` Docker volume (or your `DATABASE_URL` database) to move user data between machines.
- Always confirm your official CGPA with your department.
