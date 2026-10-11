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
		Port:        get("PORT", "8087"),
		DatabaseURL: get("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/kathputli_payment"),
		JWTSecret:   get("JWT_SECRET", "change-me"),
		NATSURL:     get("NATS_URL", "nats://localhost:4222"),
	}
}

func get(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
