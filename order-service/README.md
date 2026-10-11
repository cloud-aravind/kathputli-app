# Kathputli Order Service

Independent Go microservice responsible for customer order creation and management.

## Responsibilities

- JWT authentication
- Order creation
- Artwork validation through Artwork Service
- Server-side price calculation
- PostgreSQL persistence
- `order.placed` NATS JetStream event
- Customer order retrieval
- Customer order cancellation

## Port

8086

## Dependencies

- PostgreSQL
- NATS JetStream
- Artwork Service

## Environment

```env
PORT=8086
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kathputli_order
JWT_SECRET=kathputli-dev-secret
NATS_URL=nats://localhost:4222
ARTWORK_SERVICE_URL=http://localhost:8085
```

## Endpoints

GET /healthz
GET /readyz

POST /api/orders
GET /api/orders
GET /api/orders/:id
PATCH /api/orders/:id/status

All order endpoints require:

Authorization: Bearer <JWT>

## Create Order

```json
{
  "artist_id": "artist-uuid",
  "items": [
    {
      "artwork_id": "artwork-uuid",
      "quantity": 2
    }
  ]
}
```

The client does not provide the price. Order Service retrieves the artwork from Artwork Service and calculates the total.

## Event

Successful order creation publishes:

order.placed

## Local build

```bash
go mod tidy
go build ./...
```

Dockerfile is intentionally deferred to the Kathputli containerization phase.
