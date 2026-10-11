-- Remove legacy delivery agents that were not provisioned from the Auth user ID.
-- Current Kathputli agents are provisioned with id = user_id.
-- This migration is intentionally idempotent and safe to run on every startup.
DELETE FROM deliveries
WHERE agent_id IN (
    SELECT id
    FROM delivery_agents
    WHERE user_id IS NULL
       OR id <> user_id
);

DELETE FROM delivery_agents
WHERE user_id IS NULL
   OR id <> user_id;
