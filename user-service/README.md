# Kathputli User Service

User profile service. Auth Service owns credentials; User Service owns profile data.

Endpoints:
- GET `/api/users/me`
- PUT `/api/users/me`
- GET `/api/users/{id}`
- GET `/healthz`
- GET `/readyz`

Consumes `user.created` from NATS JetStream using durable consumer `user-service`.

Stream: `KATHPUTLI_EVENTS`
Subject: `user.created`

Profile creation is idempotent through an upsert on the user ID.
