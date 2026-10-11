# Kathputli Auth Service

Authentication and JWT issuance service.

Endpoints:
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- GET `/healthz`
- GET `/readyz`

After successful registration, Auth publishes a `user.created` event to NATS JetStream.

Stream: `KATHPUTLI_EVENTS`
Subject: `user.created`
