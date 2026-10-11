# syntax=docker/dockerfile:1

# Build stage
FROM golang:1.25.13-alpine3.23 AS builder

WORKDIR /app

# Copy dependency files first for Docker layer caching.
COPY go.mod go.sum ./
RUN go mod download

# Copy application source and build the Linux binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-w -s" -o /bin/app ./cmd/server


# Runtime stage
FROM gcr.io/distroless/static-debian12:nonroot AS runtime

WORKDIR /app

# Only the compiled binary is included in the runtime image.
COPY --from=builder /bin/app /bin/app

EXPOSE 8082

ENTRYPOINT ["/bin/app"]