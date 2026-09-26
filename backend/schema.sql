CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    href TEXT NOT NULL,
    image TEXT NOT NULL
);
