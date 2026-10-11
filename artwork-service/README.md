# Kathputli Artwork Service

Independent Artwork Service for Kathputli.

## Responsibilities
- Artist-owned categories
- Artwork CRUD
- JWT authentication and artist-admin authorization
- Artist ownership validation through the Artist Service
- Separate PostgreSQL persistence
- `artwork.created` NATS JetStream event
- Health/readiness endpoints

## Endpoints
- POST /api/artists/{artistID}/categories
- GET /api/artists/{artistID}/categories
- POST /api/artists/{artistID}/artworks
- GET /api/artists/{artistID}/artworks
- GET /api/artworks/{id}
- PUT /api/artworks/{id}
- DELETE /api/artworks/{id}
- GET /healthz
- GET /readyz

## Local setup
Create `kathputli_artwork`, then:

```bash
go mod tidy
go build ./...
JWT_SECRET=kathputli-dev-secret NATS_URL=nats://localhost:4222 ARTIST_SERVICE_URL=http://localhost:8084 PORT=8085 go run ./cmd/server
```
