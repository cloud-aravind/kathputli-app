-- This file is executed on every startup by the current migration runner.
-- Keep legacy agent and delivery records intact; assignment queries already
-- exclude agents that are not linked to an Auth user.
SELECT 1;
