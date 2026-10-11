CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    phone VARCHAR(50),
    address TEXT NOT NULL,
    city VARCHAR(120) NOT NULL,
    state VARCHAR(120),
    country VARCHAR(120),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artists_city ON artists(city);
CREATE INDEX IF NOT EXISTS idx_artists_email ON artists(email);
