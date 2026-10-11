# Kathputli Payment Service

Independent payment microservice for the Kathputli platform.

## Responsibilities

- Accept payment requests for orders.
- Maintain payment records independently from Order Service.
- Consume `order.placed` events from NATS JetStream.
- Publish payment lifecycle events.
- Expose health/readiness endpoints.
- Verify JWTs for customer-facing payment endpoints.

## Local configuration

```bash
go mod tidy
go build ./...
```

Run:

```bash
JWT_SECRET=kathputli-dev-secret NATS_URL=nats://localhost:4222 DATABASE_URL=postgres://postgres:postgres@localhost:5432/kathputli_payment PORT=8087 go run ./cmd/server
```

## API

- POST `/api/payments`
- GET `/api/payments/{id}`
- GET `/api/orders/{orderID}/payment`
- GET `/healthz`
- GET `/readyz`

The initial implementation uses a simulated payment processor. It is intentionally provider-neutral so a real payment gateway can be integrated later without coupling Order Service to the provider.
