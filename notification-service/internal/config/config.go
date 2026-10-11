package config

import "os"

type Config struct {
    Port        string
    DatabaseURL string
    JWTSecret   string
    NATSURL     string
}

func Load() Config {
    return Config{
        Port:        getEnv("PORT", "8088"),
        DatabaseURL: getEnv(
            "DATABASE_URL",
            "postgres://postgres:postgres@localhost:5432/kathputli_notification",
        ),
        JWTSecret: getEnv("JWT_SECRET", "change-me"),
        NATSURL: getEnv("NATS_URL", "nats://localhost:4222"),
    }
}

func getEnv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return fallback
}
