package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"

	"github.com/kathputli/delivery-service/internal/broker"
	"github.com/kathputli/delivery-service/internal/config"
	"github.com/kathputli/delivery-service/internal/handler"
	"github.com/kathputli/delivery-service/internal/migrations"
	"github.com/kathputli/delivery-service/internal/repository"
	"github.com/kathputli/delivery-service/internal/service"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	db, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer db.Close()

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := db.Ping(pingCtx); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	if err := repository.RunMigrations(ctx, db, migrations.FS()); err != nil {
		log.Fatalf("database migrations failed: %v", err)
	}

	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		log.Fatalf("nats connection failed: %v", err)
	}
	defer nc.Drain()

	nb := broker.New(nc)
	if err := nb.EnsureStream(ctx); err != nil {
		log.Fatalf("nats stream setup failed: %v", err)
	}

	repo := repository.New(db)
	svc := service.New(repo, nb)

	if err := nb.StartConsumers(
		ctx,
		svc.HandleUserCreated,
		svc.HandlePaymentCompleted,
	); err != nil {
		log.Fatalf("delivery consumers failed: %v", err)
	}

	h := handler.New(svc, cfg.JWTSecret)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           h.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("delivery-service listening on :%s", cfg.Port)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("delivery-service stopped: %v", err)
		os.Exit(1)
	}
}
