package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/kathputli/artwork-service/internal/migrations"
	"github.com/kathputli/artwork-service/internal/model"
)

type Repository struct{ db *pgxpool.Pool }

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

func (r *Repository) Close() { r.db.Close() }

func (r *Repository) RunMigrations(ctx context.Context) error {
	data, err := migrations.Files.ReadFile("001_create_artwork.sql")
	if err != nil {
		return fmt.Errorf("read migration: %w", err)
	}
	if _, err := r.db.Exec(ctx, string(data)); err != nil {
		return fmt.Errorf("execute migration: %w", err)
	}
	return nil
}

func (r *Repository) CreateCategory(ctx context.Context, c *model.Category) error {
	return r.db.QueryRow(ctx, `
        INSERT INTO categories (id, artist_id, name, slug)
        VALUES ($1,$2,$3,$4) RETURNING created_at, updated_at
    `, c.ID, c.ArtistID, c.Name, c.Slug).Scan(&c.CreatedAt, &c.UpdatedAt)
}

func (r *Repository) ListCategories(ctx context.Context, artistID uuid.UUID) ([]model.Category, error) {
	rows, err := r.db.Query(ctx, `
        SELECT id, artist_id, name, slug, created_at, updated_at
        FROM categories WHERE artist_id=$1 ORDER BY name
    `, artistID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Category, 0)
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.ID, &c.ArtistID, &c.Name, &c.Slug, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *Repository) CategoryBelongsToArtist(ctx context.Context, categoryID, artistID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
        SELECT EXISTS(SELECT 1 FROM categories WHERE id=$1 AND artist_id=$2)
    `, categoryID, artistID).Scan(&exists)
	return exists, err
}

func (r *Repository) CreateArtwork(ctx context.Context, a *model.Artwork) error {
	return r.db.QueryRow(ctx, `
        INSERT INTO artworks
        (id,artist_id,category_id,title,description,price,currency,image_url,stock,is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING created_at, updated_at
    `, a.ID, a.ArtistID, a.CategoryID, a.Title, a.Description, a.Price, a.Currency, a.ImageURL, a.Stock, a.IsActive).
		Scan(&a.CreatedAt, &a.UpdatedAt)
}

func (r *Repository) GetArtwork(ctx context.Context, id uuid.UUID) (*model.Artwork, error) {
	var a model.Artwork
	err := r.db.QueryRow(ctx, `
        SELECT a.id,a.artist_id,a.category_id,COALESCE(c.name,''),a.title,a.description,a.price,a.currency,a.image_url,a.stock,a.is_active,a.created_at,a.updated_at
        FROM artworks a LEFT JOIN categories c ON c.id=a.category_id WHERE a.id=$1
    `, id).Scan(&a.ID, &a.ArtistID, &a.CategoryID, &a.CategoryName, &a.Title, &a.Description, &a.Price, &a.Currency, &a.ImageURL, &a.Stock, &a.IsActive, &a.CreatedAt, &a.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) ListArtworks(ctx context.Context, artistID uuid.UUID) ([]model.Artwork, error) {
	rows, err := r.db.Query(ctx, `
        SELECT a.id,a.artist_id,a.category_id,COALESCE(c.name,''),a.title,a.description,a.price,a.currency,a.image_url,a.stock,a.is_active,a.created_at,a.updated_at
        FROM artworks a LEFT JOIN categories c ON c.id=a.category_id WHERE a.artist_id=$1 ORDER BY a.created_at DESC
    `, artistID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Artwork, 0)
	for rows.Next() {
		var a model.Artwork
		if err := rows.Scan(&a.ID, &a.ArtistID, &a.CategoryID, &a.CategoryName, &a.Title, &a.Description, &a.Price, &a.Currency, &a.ImageURL, &a.Stock, &a.IsActive, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (r *Repository) ListActiveArtworks(ctx context.Context) ([]model.Artwork, error) {
	rows, err := r.db.Query(ctx, `
        SELECT a.id,a.artist_id,a.category_id,COALESCE(c.name,''),a.title,a.description,a.price,a.currency,a.image_url,a.stock,a.is_active,a.created_at,a.updated_at
        FROM artworks a LEFT JOIN categories c ON c.id=a.category_id
        WHERE a.is_active=TRUE AND a.stock > 0 ORDER BY a.created_at DESC
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Artwork, 0)
	for rows.Next() {
		var a model.Artwork
		if err := rows.Scan(&a.ID, &a.ArtistID, &a.CategoryID, &a.CategoryName, &a.Title, &a.Description, &a.Price, &a.Currency, &a.ImageURL, &a.Stock, &a.IsActive, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (r *Repository) UpdateArtwork(ctx context.Context, a *model.Artwork) error {
	return r.db.QueryRow(ctx, `
        UPDATE artworks SET category_id=$2,title=$3,description=$4,price=$5,currency=$6,
        image_url=$7,stock=$8,is_active=$9,updated_at=NOW()
        WHERE id=$1 RETURNING updated_at
    `, a.ID, a.CategoryID, a.Title, a.Description, a.Price, a.Currency, a.ImageURL, a.Stock, a.IsActive).
		Scan(&a.UpdatedAt)
}

func (r *Repository) DeleteArtwork(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.Exec(ctx, `DELETE FROM artworks WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func Slugify(value string) string {
	return strings.NewReplacer(" ", "-", "_", "-").Replace(strings.ToLower(strings.TrimSpace(value)))
}
