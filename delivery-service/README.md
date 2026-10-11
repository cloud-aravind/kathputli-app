# Kathputli Delivery Service

Independent Delivery Service for the Kathputli platform.

## Responsibility

- Provision delivery agents from `user.created` events when the user role is `delivery-agent`
- Create a delivery after successful payment
- Automatically assign an available real delivery-agent user
- Track delivery status
- Release the agent after delivery
- Publish delivery events

## Agent Architecture

Auth Service owns identity and roles.

When a user is created with role `delivery-agent`, Auth publishes `user.created`.
The Delivery Service consumes that event and creates its operational delivery-agent record.

The Delivery Service never hardcodes a user ID in Docker Compose or application configuration.

New deliveries are assigned only to agents linked to a real Auth user (`user_id IS NOT NULL`).

## Event Flow

Auth Service
    |
    | user.created (role=delivery-agent)
    v
NATS JetStream
    |
    v
Delivery Service
    |
    +-- delivery_agents (operational availability)

Payment Service
    |
    | payment.completed
    v
NATS JetStream
    |
    v
Delivery Service
    |
    +-- assign available agent
    +-- PostgreSQL
    +-- delivery.updated

## Port

8089

## Database

kathputli_delivery

## NATS

nats://localhost:4222

Stream: KATHPUTLI_EVENTS

Consumed:
- user.created
- payment.completed

Published:
- delivery.updated

## API

GET /healthz

GET /readyz

GET /api/deliveries/order/{orderID}

PATCH /api/deliveries/{deliveryID}

PATCH requires a JWT with role `delivery-agent` and only the assigned agent can update its delivery.

Valid status transitions:

assigned -> picked_up -> out_for_delivery -> delivered

## Local Build

go mod tidy
go build ./...

## Local Run

DATABASE_URL=postgres://postgres:postgres@localhost:5432/kathputli_delivery JWT_SECRET=kathputli-dev-secret NATS_URL=nats://localhost:4222 PORT=8089 go run ./cmd/server
