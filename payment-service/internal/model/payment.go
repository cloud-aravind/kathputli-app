package model

import "time"

const (
	StatusPending   = "pending"
	StatusCompleted = "completed"
	StatusFailed    = "failed"
)

type Payment struct {
	ID            string    `json:"id"`
	OrderID       string    `json:"order_id"`
	CustomerID    string    `json:"customer_id"`
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Method        string    `json:"method"`
	Status        string    `json:"status"`
	Provider      string    `json:"provider"`
	ProviderRef   string    `json:"provider_ref,omitempty"`
	FailureReason string    `json:"failure_reason,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreatePaymentRequest struct {
	OrderID string `json:"order_id"`
	Method  string `json:"method"`
}

// OrderPlacedEvent represents the event published by Order Service.
//
// Important:
// Order Service uses:
//
//	user_id
//	total_price
//
// Payment Service maps these into:
//
//	CustomerID
//	Amount
type OrderPlacedEvent struct {
	EventID string `json:"event_id"`
	OrderID    string  `json:"order_id"`
	UserID     string  `json:"user_id"`
	ArtistID   string  `json:"artist_id"`
	TotalPrice float64 `json:"total_price"`
	Currency   string  `json:"currency"`
}

type PaymentEvent struct {
	EventID     string  `json:"event_id"`
	PaymentID   string  `json:"payment_id"`
	OrderID     string  `json:"order_id"`
	CustomerID  string  `json:"customer_id"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Status      string  `json:"status"`
	Provider    string  `json:"provider"`
	ProviderRef string  `json:"provider_ref,omitempty"`
}
