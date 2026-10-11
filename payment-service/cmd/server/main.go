package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"

	"github.com/kathputli/payment-service/internal/broker"
	"github.com/kathputli/payment-service/internal/config"
	"github.com/kathputli/payment-service/internal/handler"
	"github.com/kathputli/payment-service/internal/migrations"
	"github.com/kathputli/payment-service/internal/repository"
	"github.com/kathputli/payment-service/internal/service"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	// Connect to PostgreSQL.
	db, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database pool: %v", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatalf("database ping: %v", err)
	}

	// Apply database migrations.
	if err := migrations.RunMigrations(ctx, db); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	// Connect to NATS.
	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		log.Fatalf("nats connect: %v", err)
	}
	defer nc.Drain()

	// Initialize JetStream.
	js, err := nc.JetStream()
	if err != nil {
		log.Fatalf("jetstream: %v", err)
	}

	// Ensure the shared Kathputli event stream exists.
	if err := broker.EnsureStream(js); err != nil {
		log.Fatalf("ensure stream: %v", err)
	}

	// Initialize repository and service layers.
	repo := repository.New(db)

	paymentService := service.New(
		repo,
		js,
	)

	// Start consuming order.placed events.
	if err := broker.StartOrderPlacedConsumer(
		js,
		paymentService,
	); err != nil {
		log.Fatalf("start order consumer: %v", err)
	}

	// Initialize HTTP handlers.
	h := handler.New(
		paymentService,
		cfg.JWTSecret,
	)

	// Start HTTP server.
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           h.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf(
		"payment-service listening on :%s",
		cfg.Port,
	)

	if err := srv.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		log.Fatalf("http server: %v", err)
	}
}
