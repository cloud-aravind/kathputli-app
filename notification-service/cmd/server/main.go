package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/nats-io/nats.go"

    "github.com/kathputli/notification-service/internal/broker"
    "github.com/kathputli/notification-service/internal/config"
    "github.com/kathputli/notification-service/internal/handler"
    "github.com/kathputli/notification-service/internal/repository"
    "github.com/kathputli/notification-service/internal/service"
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

    if err := repository.RunMigrations(ctx, db); err != nil {
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
    svc := service.New(repo)

    if err := nb.StartConsumers(ctx, svc); err != nil {
        log.Fatalf("notification consumers failed: %v", err)
    }

    h := handler.New(svc, cfg.JWTSecret)

    server := &http.Server{
        Addr:              ":" + cfg.Port,
        Handler:           h.Routes(),
        ReadHeaderTimeout: 5 * time.Second,
    }

    log.Printf("notification-service listening on :%s", cfg.Port)

    if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        log.Printf("notification-service stopped: %v", err)
        os.Exit(1)
    }
}
