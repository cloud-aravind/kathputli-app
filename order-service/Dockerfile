# syntax=docker/dockerfile:1

# Build stage
FROM golang:1.25.13-alpine3.23 AS builder

WORKDIR /app

# Copy dependencies first for Docker layer caching.
COPY go.mod go.sum ./
RUN go mod download

# Build the Linux application binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-w -s" \
    -o /bin/app \
    ./cmd/server

# Runtime stage
FROM gcr.io/distroless/static-debian12:nonroot AS runtime

WORKDIR /app

# Copy only the compiled binary into the runtime image.
COPY --from=builder /bin/app /bin/app

EXPOSE 8086

ENTRYPOINT ["/bin/app"]