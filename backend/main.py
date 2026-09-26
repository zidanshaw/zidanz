from __future__ import annotations

import json
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(__file__).resolve().parent / "portfolio.db"
PROJECTS_JSON = ROOT / "data" / "projects.json"
SCHEMA = Path(__file__).resolve().parent / "schema.sql"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.executescript(SCHEMA.read_text(encoding="utf-8"))
        projects = json.loads(PROJECTS_JSON.read_text(encoding="utf-8"))
        connection.executemany(
            """
            INSERT INTO projects (id, number, title, description, category, href, image)
            VALUES (:id, :number, :title, :description, :category, :href, :image)
            ON CONFLICT(id) DO UPDATE SET
                number=excluded.number,
                title=excluded.title,
                description=excluded.description,
                category=excluded.category,
                href=excluded.href,
                image=excluded.image
            """,
            projects,
        )
        connection.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Zidan Portfolio API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/projects")
def projects() -> list[dict[str, str]]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, number, title, description, category, href, image FROM projects ORDER BY number"
        ).fetchall()
    return [dict(row) for row in rows]


app.mount("/", StaticFiles(directory=ROOT, html=True), name="site")
