package model

import (
	"time"

	"github.com/google/uuid"
)

const (
	StatusPendingPayment = "pending_payment"
	StatusConfirmed      = "confirmed"
	StatusShipped        = "shipped"
	StatusDelivered      = "delivered"
	StatusCancelled      = "cancelled"
)

type Order struct {
	ID         uuid.UUID   `json:"id"`
	UserID     uuid.UUID   `json:"user_id"`
	ArtistID   uuid.UUID   `json:"artist_id"`
	Status     string      `json:"status"`
	TotalPrice float64     `json:"total_price"`
	Currency   string      `json:"currency"`
	Items      []OrderItem `json:"items"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID        uuid.UUID `json:"id"`
	OrderID   uuid.UUID `json:"order_id"`
	ArtworkID uuid.UUID `json:"artwork_id"`
	Title     string    `json:"title"`
	Quantity  int       `json:"quantity"`
	UnitPrice float64   `json:"unit_price"`
	Subtotal  float64   `json:"subtotal"`
	Currency  string    `json:"currency"`
}

type CreateOrderRequest struct {
	Items []OrderItemRequest `json:"items" binding:"required,min=1"`
}

type OrderItemRequest struct {
	ArtworkID uuid.UUID `json:"artwork_id" binding:"required"`
	Quantity  int       `json:"quantity" binding:"required,min=1"`
}

type ArtworkDetails struct {
	ID       uuid.UUID `json:"id"`
	ArtistID uuid.UUID `json:"artist_id"`
	Title    string    `json:"title"`
	Price    float64   `json:"price"`
	Currency string    `json:"currency"`
	Stock    int       `json:"stock"`
	IsActive bool      `json:"is_active"`
}

type OrderPlacedEvent struct {
	EventID    string  `json:"event_id"`
	OrderID    string  `json:"order_id"`
	UserID     string  `json:"user_id"`
	ArtistID   string  `json:"artist_id"`
	TotalPrice float64 `json:"total_price"`
	Currency   string  `json:"currency"`
	Status     string  `json:"status"`
	CreatedAt  string  `json:"created_at"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
