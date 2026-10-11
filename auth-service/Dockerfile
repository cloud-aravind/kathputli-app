# syntax=docker/dockerfile:1

# ============================================================
# Stage 1: Build
# Compile the Go application into a Linux executable.
# ============================================================
FROM golang:1.25.13-alpine3.23 AS builder

# Set the working directory inside the builder container.
WORKDIR /app

# Copy dependency definition files first.
# This allows Docker to cache the dependency layer.
COPY go.mod go.sum ./

# Download Go dependencies defined by go.mod/go.sum.
RUN go mod download

# Copy the remaining application source code.
COPY . .

# Build a static Linux binary.
# - CGO_ENABLED=0: disable CGO for a self-contained Go binary
# - GOOS=linux: target the Linux container runtime
# - -trimpath: remove local build-machine paths
# - -ldflags="-w -s": remove unnecessary debug/symbol information
# - -o /bin/app: create the executable at /bin/app
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-w -s" -o /bin/app ./cmd/server


# ============================================================
# Stage 2: Runtime
# Run only the compiled application using a minimal,
# non-root Distroless runtime image.
# ============================================================
FROM gcr.io/distroless/static-debian12:nonroot AS runtime

# Set the runtime working directory.
WORKDIR /app

# Copy only the compiled binary from the builder stage.
# Go compiler, source code and build dependencies are not
# included in the final runtime image.
COPY --from=builder /bin/app /bin/app

# Document the port used by the Auth Service.
EXPOSE 8083

# Start the Auth Service.
ENTRYPOINT ["/bin/app"]