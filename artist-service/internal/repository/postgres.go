package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/kathputli/artist-service/internal/migrations"
	"github.com/kathputli/artist-service/internal/model"
)

type Repository struct {
	db *pgxpool.Pool
}

func New(ctx context.Context, databaseURL string) (*Repository, error) {
	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(ctx); err != nil {
		db.Close()
		return nil, err
	}

	return &Repository{db: db}, nil
}

func (r *Repository) Close() {
	r.db.Close()
}

func (r *Repository) RunMigrations(ctx context.Context) error {
	data, err := migrations.Files.ReadFile("001_create_artists.sql")
	if err != nil {
		return fmt.Errorf("read migration: %w", err)
	}

	if _, err := r.db.Exec(ctx, string(data)); err != nil {
		return fmt.Errorf("execute migration: %w", err)
	}

	return nil
}

func (r *Repository) Create(ctx context.Context, artist *model.Artist) error {
	const query = `
        INSERT INTO artists (
            id, user_id, name, email, phone, address, city, state, country, bio
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING created_at, updated_at
    `

	return r.db.QueryRow(
		ctx, query,
		artist.ID,
		artist.UserID,
		artist.Name,
		artist.Email,
		artist.Phone,
		artist.Address,
		artist.City,
		artist.State,
		artist.Country,
		artist.Bio,
	).Scan(&artist.CreatedAt, &artist.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*model.Artist, error) {
	const query = `
        SELECT id, user_id, name, email, phone, address, city, state, country, bio, created_at, updated_at
        FROM artists
        WHERE id = $1
    `

	var artist model.Artist
	err := r.db.QueryRow(ctx, query, id).Scan(
		&artist.ID,
		&artist.UserID,
		&artist.Name,
		&artist.Email,
		&artist.Phone,
		&artist.Address,
		&artist.City,
		&artist.State,
		&artist.Country,
		&artist.Bio,
		&artist.CreatedAt,
		&artist.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &artist, nil
}

func (r *Repository) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.Artist, error) {
	const query = `
        SELECT id, user_id, name, email, phone, address, city, state, country, bio, created_at, updated_at
        FROM artists
        WHERE user_id = $1
    `

	var artist model.Artist
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&artist.ID,
		&artist.UserID,
		&artist.Name,
		&artist.Email,
		&artist.Phone,
		&artist.Address,
		&artist.City,
		&artist.State,
		&artist.Country,
		&artist.Bio,
		&artist.CreatedAt,
		&artist.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &artist, nil
}

func (r *Repository) Update(ctx context.Context, artist *model.Artist) error {
	const query = `
        UPDATE artists
        SET name = $2,
            email = $3,
            phone = $4,
            address = $5,
            city = $6,
            state = $7,
            country = $8,
            bio = $9,
            updated_at = NOW()
        WHERE id = $1
        RETURNING updated_at
    `

	return r.db.QueryRow(
		ctx, query,
		artist.ID,
		artist.Name,
		artist.Email,
		artist.Phone,
		artist.Address,
		artist.City,
		artist.State,
		artist.Country,
		artist.Bio,
	).Scan(&artist.UpdatedAt)
}
