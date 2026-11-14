package migrations

import (
    "context"
    "embed"
    "fmt"
    "sort"
    "strings"

    "github.com/jackc/pgx/v5/pgxpool"
)

//go:embed *.sql
var files embed.FS

func Run(ctx context.Context, pool *pgxpool.Pool) error {
    entries, err := files.ReadDir(".")
    if err != nil {
        return fmt.Errorf("read migrations directory: %w", err)
    }

    names := make([]string, 0, len(entries))
    for _, entry := range entries {
        if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
            names = append(names, entry.Name())
        }
    }
    sort.Strings(names)

    for _, name := range names {
        data, err := files.ReadFile(name)
        if err != nil {
            return fmt.Errorf("read migration %s: %w", name, err)
        }
        if _, err := pool.Exec(ctx, string(data)); err != nil {
            return fmt.Errorf("execute migration %s: %w", name, err)
        }
    }

    return nil
}
