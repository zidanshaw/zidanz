# Optional FastAPI backend

The portfolio remains deployable as a static site. This backend adds a small API and SQLite data layer without making the frontend depend on it.

## Run

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open `http://127.0.0.1:8000`.

The frontend tries `/api/projects` first and falls back to `data/projects.json`, so GitHub Pages/static hosting still works.
