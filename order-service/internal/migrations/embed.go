package migrations

import (
    "context"
    "embed"
    "fmt"

    "github.com/jackc/pgx/v5/pgxpool"
)

//go:embed *.sql
var files embed.FS

func Run(ctx context.Context, pool *pgxpool.Pool) error {
    data, err := files.ReadFile("001_create_orders.sql")
    if err != nil {
        return fmt.Errorf("read migration: %w", err)
    }

    if _, err := pool.Exec(ctx, string(data)); err != nil {
        return fmt.Errorf("execute migration: %w", err)
    }

    return nil
}
