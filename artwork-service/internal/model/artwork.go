package model

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID `json:"id"`
	ArtistID  uuid.UUID `json:"artist_id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Artwork struct {
	ID           uuid.UUID  `json:"id"`
	ArtistID     uuid.UUID  `json:"artist_id"`
	CategoryID   *uuid.UUID `json:"category_id,omitempty"`
	CategoryName string     `json:"category_name,omitempty"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	Price        float64    `json:"price"`
	Currency     string     `json:"currency"`
	ImageURL     string     `json:"image_url"`
	Stock        int        `json:"stock"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name string `json:"name"`
}

type CreateArtworkRequest struct {
	CategoryID  *uuid.UUID `json:"category_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Price       float64    `json:"price"`
	Currency    string     `json:"currency"`
	ImageURL    string     `json:"image_url"`
	Stock       int        `json:"stock"`
}

type UpdateArtworkRequest struct {
	CategoryID  *uuid.UUID `json:"category_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Price       float64    `json:"price"`
	Currency    string     `json:"currency"`
	ImageURL    string     `json:"image_url"`
	Stock       int        `json:"stock"`
	IsActive    bool       `json:"is_active"`
}

type ArtworkCreatedEvent struct {
	EventID    string     `json:"event_id"`
	Event      string     `json:"event"`
	ArtworkID  uuid.UUID  `json:"artwork_id"`
	ArtistID   uuid.UUID  `json:"artist_id"`
	CategoryID *uuid.UUID `json:"category_id,omitempty"`
	Title      string     `json:"title"`
	Price      float64    `json:"price"`
	Currency   string     `json:"currency"`
	CreatedAt  time.Time  `json:"created_at"`
}
