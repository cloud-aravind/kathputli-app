package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	StatusPendingPayment = "pending_payment"
	StatusConfirmed      = "confirmed"
	StatusPaymentFailed  = "payment_failed"
	StatusShipped        = "shipped"
	StatusDelivered      = "delivered"
	StatusCancelled      = "cancelled"
)

type ShippingAddress struct {
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	City     string `json:"city"`
	State    string `json:"state"`
	Pincode  string `json:"pincode"`
}

func (s *ShippingAddress) UnmarshalJSON(data []byte) error {
	type Alias ShippingAddress
	var aux struct {
		Alias
		AltFullName string `json:"fullName"`
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	*s = ShippingAddress(aux.Alias)
	if s.FullName == "" && aux.AltFullName != "" {
		s.FullName = aux.AltFullName
	}
	return nil
}

type Order struct {
	ID              uuid.UUID        `json:"id"`
	UserID          uuid.UUID        `json:"user_id"`
	ArtistID        uuid.UUID        `json:"artist_id"`
	Status          string           `json:"status"`
	Subtotal        float64          `json:"subtotal"`
	ShippingAmount  float64          `json:"shipping_amount"`
	TotalPrice      float64          `json:"total_price"`
	Currency        string           `json:"currency"`
	Items           []OrderItem      `json:"items"`
	ShippingAddress *ShippingAddress `json:"shipping_address,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
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
	Items           []OrderItemRequest `json:"items" binding:"required,min=1"`
	ShippingAddress *ShippingAddress   `json:"shipping_address,omitempty"`
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

// PaymentEvent matches payment-service events on payment.completed and payment.failed.
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

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
