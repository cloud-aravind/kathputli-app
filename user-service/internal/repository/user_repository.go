package repository

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kathputli/user-service/internal/model"
	"strings"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct{ db *pgxpool.Pool }

func NewUserRepository(ctx context.Context, url string) (*UserRepository, error) {
	db, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(ctx); err != nil {
		db.Close()
		return nil, err
	}
	return &UserRepository{db}, nil
}
func (r *UserRepository) Close()                          { r.db.Close() }
func (r *UserRepository) Ready(ctx context.Context) error { return r.db.Ping(ctx) }
func (r *UserRepository) Migrate(ctx context.Context) error {
	_, err := r.db.Exec(ctx, `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(320) NOT NULL,
        role VARCHAR(40) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
	return err
}
func (r *UserRepository) UpsertFromEvent(ctx context.Context, event model.UserCreatedEvent) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO users (id, name, email, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, COALESCE(NULLIF($5, '')::timestamptz, NOW()), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name, email = EXCLUDED.email,
			role = EXCLUDED.role, updated_at = NOW()
	`, event.UserID, event.Name, strings.ToLower(event.Email), event.Role, event.CreatedAt)
	return err
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	var u model.User
	err := r.db.QueryRow(ctx, `SELECT id,name,email,role,created_at::text,updated_at::text FROM users WHERE id=$1`, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.User{}, ErrUserNotFound
	}
	return u, err
}
func (r *UserRepository) Create(ctx context.Context, u model.User) error {
	_, err := r.db.Exec(ctx, `INSERT INTO users(id,name,email,role) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING`,
		u.ID, u.Name, strings.ToLower(u.Email), u.Role)
	return err
}
func (r *UserRepository) UpdateName(ctx context.Context, id uuid.UUID, name string) (model.User, error) {
	var u model.User
	err := r.db.QueryRow(ctx, `UPDATE users SET name=$1,updated_at=NOW() WHERE id=$2
        RETURNING id,name,email,role,created_at::text,updated_at::text`, name, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.User{}, ErrUserNotFound
	}
	return u, err
}
