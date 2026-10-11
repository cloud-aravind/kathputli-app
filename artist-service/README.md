# Kathputli Artist Service

Independent Artist Service for the Kathputli backend.

## Responsibilities

- Create artist profiles
- Get artist profiles
- Update artist profiles
- Authenticate requests using the JWT issued by Auth Service
- Authorize `artist-admin` operations
- Persist artist data in its own PostgreSQL database
- Publish `artist.created` events through NATS JetStream
- Expose health and readiness endpoints

## Endpoints

- `POST /api/artists`
- `GET /api/artists/{id}`
- `PUT /api/artists/{id}`
- `GET /healthz`
- `GET /readyz`

## Create artist

Requires a JWT with role `artist-admin`.

Example:

```json
{
  "name": "Madhavi Arts",
  "email": "artist@example.com",
  "phone": "+91-9000000000",
  "address": "123 Art Street",
  "city": "Kochi",
  "state": "Kerala",
  "country": "India",
  "bio": "Traditional Indian folk artist"
}
```

The authenticated JWT subject becomes the `user_id` owner of the artist profile.

## Local setup

Create the PostgreSQL database:

```sql
CREATE DATABASE kathputli_artist;
```

Then:

```bash
go mod tidy
go build ./...
```

Run:

```bash
NATS_URL=nats://localhost:4222 PORT=8083 go run ./cmd/server
```

The service applies embedded migrations on startup.
