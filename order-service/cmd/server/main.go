package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"

	"github.com/kathputli/order-service/internal/broker"
	"github.com/kathputli/order-service/internal/client"
	"github.com/kathputli/order-service/internal/config"
	"github.com/kathputli/order-service/internal/handler"
	"github.com/kathputli/order-service/internal/migrations"
	"github.com/kathputli/order-service/internal/repository"
	"github.com/kathputli/order-service/internal/service"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	// PostgreSQL connection pool
	db, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer db.Close()

	// Initial database connectivity check
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := db.Ping(pingCtx); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	// Run database migrations
	if err := migrations.Run(ctx, db); err != nil {
		log.Fatalf("database migrations failed: %v", err)
	}

	// NATS connection
	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		log.Fatalf("nats connection failed: %v", err)
	}
	defer nc.Drain()

	nb := broker.New(nc)

	// Ensure JetStream stream exists
	if err := nb.EnsureStream(ctx); err != nil {
		log.Fatalf("nats stream setup failed: %v", err)
	}

	// Dependencies
	repo := repository.New(db)
	artworkClient := client.NewArtworkClient(cfg.ArtworkServiceURL)

	svc := service.New(
		repo,
		artworkClient,
		nb,
	)

	// HTTP router
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// Health endpoint
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "order-service",
			"status":  "ok",
		})
	})

	// Readiness endpoint
	router.GET("/readyz", func(c *gin.Context) {
		readyCtx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if err := db.Ping(readyCtx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "not ready",
				"error":  "database unavailable",
			})
			return
		}

		if !nc.IsConnected() {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "not ready",
				"error":  "nats unavailable",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "ready",
		})
	})

	// Application routes
	h := handler.New(svc, cfg.JWTSecret)
	h.Register(router)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("order-service listening on :%s", cfg.Port)

	if err := server.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		log.Printf("order-service stopped: %v", err)
		os.Exit(1)
	}
}
