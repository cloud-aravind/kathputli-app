# Kathputli Notification Service

Independent notification microservice for Kathputli.

## Responsibilities

- Consume `order.placed` and `payment.completed` events from NATS JetStream.
- Create notification records in the dedicated `kathputli_notification` database.
- Expose authenticated APIs for customers to list their notifications and mark a notification as read.
- Provide `/healthz` and `/readyz`.

## Local port

- HTTP: `8088`
- PostgreSQL database: `kathputli_notification`
- NATS: `4222`

## APIs

GET `/healthz`

GET `/readyz`

GET `/api/notifications`

GET `/api/notifications/{id}`

PATCH `/api/notifications/{id}/read`

All `/api/notifications` endpoints require a JWT Bearer token.

## Events

Consumed:

- `order.placed`
- `payment.completed`

Shared stream:

- `KATHPUTLI_EVENTS`

The service creates a customer notification for each supported event.

No Dockerfile is included intentionally; Dockerfiles will be written separately during the containerization phase.
