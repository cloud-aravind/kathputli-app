package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kathputli/artist-service/internal/broker"
	"github.com/kathputli/artist-service/internal/config"
	"github.com/kathputli/artist-service/internal/handler"
	"github.com/kathputli/artist-service/internal/repository"
	"github.com/kathputli/artist-service/internal/service"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	repo, err := repository.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer repo.Close()

	if err := repo.RunMigrations(ctx); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	natsClient, err := broker.New(cfg.NATSURL)
	if err != nil {
		log.Fatalf("failed to connect to NATS: %v", err)
	}
	defer natsClient.Close()

	if err := natsClient.EnsureStream(); err != nil {
		log.Fatalf("failed to ensure NATS stream: %v", err)
	}

	artistService := service.NewArtistService(repo, natsClient)
	h := handler.New(artistService, cfg.JWTSecret)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           h.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("artist-service listening on :%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown failed: %v", err)
	}
}
