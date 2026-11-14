package config

import "os"

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	NATSURL          string
	InternalAPIToken string
}

func Load() Config {
	return Config{
		Port:             getEnv("PORT", "8084"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/kathputli_artist"),
		JWTSecret:        getEnv("JWT_SECRET", "change-me"),
		NATSURL:          getEnv("NATS_URL", "nats://localhost:4222"),
		InternalAPIToken: getEnv("ARTIST_INTERNAL_API_TOKEN", ""),
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
