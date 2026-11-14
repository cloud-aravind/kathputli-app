package config

import "os"

type Config struct {
	Port                   string
	DatabaseURL            string
	JWTSecret              string
	NATSURL                string
	ArtistServiceURL       string
	ArtistInternalAPIToken string
}

func Load() Config {
	return Config{
		Port:                   getEnv("PORT", "8085"),
		DatabaseURL:            getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/kathputli_artwork"),
		JWTSecret:              getEnv("JWT_SECRET", "change-me"),
		NATSURL:                getEnv("NATS_URL", "nats://localhost:4222"),
		ArtistServiceURL:       getEnv("ARTIST_SERVICE_URL", "http://localhost:8084"),
		ArtistInternalAPIToken: getEnv("ARTIST_INTERNAL_API_TOKEN", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
