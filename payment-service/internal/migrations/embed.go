package migrations

import (
	"context"
	"embed"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed 001_create_payments.sql
var migrationFS embed.FS

// RunMigrations applies the Payment Service database schema.
func RunMigrations(ctx context.Context, db *pgxpool.Pool) error {
	sql, err := migrationFS.ReadFile("001_create_payments.sql")
	if err != nil {
		return fmt.Errorf("read migration: %w", err)
	}

	if _, err := db.Exec(ctx, string(sql)); err != nil {
		return fmt.Errorf("apply migration: %w", err)
	}

	return nil
}
