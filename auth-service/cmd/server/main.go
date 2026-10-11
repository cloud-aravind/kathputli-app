package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kathputli/auth-service/internal/broker"
	"github.com/kathputli/auth-service/internal/config"
	"github.com/kathputli/auth-service/internal/handler"
	"github.com/kathputli/auth-service/internal/repository"
	"github.com/kathputli/auth-service/internal/service"
)

func main() {
	cfg := config.Load()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userRepo, err := repository.NewUserRepository(ctx, cfg.DatabaseURL())
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer userRepo.Close()
	if err := userRepo.Migrate(ctx); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	natsClient, err := broker.NewClient(cfg.NATSURL)
	if err != nil {
		log.Fatalf("nats connection failed: %v", err)
	}
	defer natsClient.Close()
	if err := natsClient.EnsureStream(); err != nil {
		log.Fatalf("nats stream setup failed: %v", err)
	}

	authService := service.NewAuthService(userRepo, natsClient, cfg.JWTSecret, cfg.JWTExpiry)
	authHandler := handler.NewAuthHandler(authService, userRepo)
	server := &http.Server{Addr: ":" + cfg.Port, Handler: authHandler.Routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}

	go func() {
		log.Printf("auth-service listening on :%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
