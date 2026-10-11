package repository

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kathputli/auth-service/internal/model"
	"strings"
	"time"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrEmailExists  = errors.New("email already exists")
)

type UserRepository struct{ db *pgxpool.Pool }

func NewUserRepository(ctx context.Context, url string) (*UserRepository, error) {
	db, e := pgxpool.New(ctx, url)
	if e != nil {
		return nil, e
	}
	c, x := context.WithTimeout(ctx, 5*time.Second)
	defer x()
	if e = db.Ping(c); e != nil {
		db.Close()
		return nil, e
	}
	return &UserRepository{db}, nil
}
func (r *UserRepository) Close()                          { r.db.Close() }
func (r *UserRepository) Ready(ctx context.Context) error { return r.db.Ping(ctx) }
func (r *UserRepository) Migrate(ctx context.Context) error {
	_, e := r.db.Exec(ctx, `CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY,name VARCHAR(120) NOT NULL,email VARCHAR(320) NOT NULL UNIQUE,password_hash TEXT NOT NULL,role VARCHAR(40) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
	return e
}
func (r *UserRepository) Create(ctx context.Context, u model.User) error {
	_, e := r.db.Exec(ctx, `INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)`, u.ID, u.Name, strings.ToLower(u.Email), u.PasswordHash, u.Role)
	if e != nil && strings.Contains(e.Error(), "users_email_key") {
		return ErrEmailExists
	}
	return e
}
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (model.User, error) {
	var u model.User
	e := r.db.QueryRow(ctx, `SELECT id,name,email,password_hash,role,created_at::text FROM users WHERE email=$1`, strings.ToLower(email)).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if errors.Is(e, pgx.ErrNoRows) {
		return model.User{}, ErrUserNotFound
	}
	return u, e
}
func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	var u model.User
	e := r.db.QueryRow(ctx, `SELECT id,name,email,password_hash,role,created_at::text FROM users WHERE id=$1`, id).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if errors.Is(e, pgx.ErrNoRows) {
		return model.User{}, ErrUserNotFound
	}
	return u, e
}
