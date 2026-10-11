package config

import "os"

type Config struct {
    Port              string
    DatabaseURL       string
    JWTSecret         string
    NATSURL           string
    ArtworkServiceURL string
}

func getenv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return fallback
}

func Load() *Config {
    return &Config{
        Port:              getenv("PORT", "8086"),
        DatabaseURL:       getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/kathputli_order"),
        JWTSecret:         getenv("JWT_SECRET", "change-me"),
        NATSURL:           getenv("NATS_URL", "nats://localhost:4222"),
        ArtworkServiceURL: getenv("ARTWORK_SERVICE_URL", "http://localhost:8085"),
    }
}
