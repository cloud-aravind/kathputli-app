CREATE TABLE IF NOT EXISTS delivery_agents (
    id UUID PRIMARY KEY,
    user_id UUID,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_agents_user_id
    ON delivery_agents(user_id);

CREATE INDEX IF NOT EXISTS idx_delivery_agents_available
    ON delivery_agents(is_available);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES delivery_agents(id),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id
    ON deliveries(order_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id
    ON deliveries(agent_id);
