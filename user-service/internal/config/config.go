package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port, DBHost, DBPort, DBUser, DBPassword, DBName, DBSSLMode, JWTSecret string
	NATSURL                                                                string
}

func Load() Config {
	return Config{
		Port: getEnv("PORT", "8082"), DBHost: getEnv("DB_HOST", "localhost"),
		DBPort: getEnv("DB_PORT", "5432"), DBUser: getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"), DBName: getEnv("DB_NAME", "kathputli_user"),
		DBSSLMode: getEnv("DB_SSLMODE", "disable"), JWTSecret: getEnv("JWT_SECRET", "change-me-in-production"), NATSURL: getEnv("NATS_URL", "nats://localhost:4222"),
	}
}
func (c Config) DatabaseURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, c.DBSSLMode)
}
func getEnv(k, f string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return f
}
