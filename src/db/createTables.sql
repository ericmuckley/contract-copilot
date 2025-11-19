CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    sdata JSONB NOT NULL,
    project_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE artifacts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_content TEXT
);

CREATE TABLE agreements(
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    root_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    origin TEXT NOT NULL,
    counterparty TEXT,
    text_content TEXT,
    notes TEXT[],
    edits JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    agreement_type TEXT NOT NULL,
    agreement_name TEXT NOT NULL,
    created_by TEXT NOT NULL
);