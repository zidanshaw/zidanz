# Zidan Portfolio

A deliberately small full-stack portfolio: semantic HTML/CSS, typed TypeScript on the client, JSON as the static data source, and an optional FastAPI + SQLite backend.

## Structure

```text
.
├── assets/               # compiled frontend assets
├── backend/              # FastAPI + SQLite
├── data/                 # static JSON data
├── images/               # portfolio images
├── src/                  # TypeScript source
├── scripts/              # small developer checks
├── *.html                # static pages
├── package.json
└── tsconfig.json
```

## Frontend build

```bash
npm install
npm run build
```

## Backend

See `backend/README.md`.

## Design principle

Motion and code are intentionally restrained. No animation library, no decorative dependencies, and no fake data generation just to make the project look larger than it is.
