package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kathputli/user-service/internal/broker"
	"github.com/kathputli/user-service/internal/config"
	"github.com/kathputli/user-service/internal/handler"
	"github.com/kathputli/user-service/internal/repository"
	"github.com/kathputli/user-service/internal/service"
)

func main() {
	cfg := config.Load()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	repo, err := repository.NewUserRepository(ctx, cfg.DatabaseURL())
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer repo.Close()

	if err := repo.Migrate(ctx); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	svc := service.NewUserService(repo)

	natsClient, err := broker.NewClient(cfg.NATSURL)
	if err != nil {
		log.Fatalf("nats connection failed: %v", err)
	}
	defer natsClient.Close()
	if err := natsClient.EnsureStream(); err != nil {
		log.Fatalf("nats stream setup failed: %v", err)
	}
	if err := natsClient.StartUserCreatedConsumer(svc); err != nil {
		log.Fatalf("user.created consumer failed: %v", err)
	}

	h := handler.NewUserHandler(svc, repo, cfg.JWTSecret)

	server := &http.Server{
		Addr: ":" + cfg.Port, Handler: h.Routes(),
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second,
		WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second,
	}

	go func() {
		log.Printf("user-service listening on :%s", cfg.Port)
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
