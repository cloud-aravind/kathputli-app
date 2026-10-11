package model

import "time"

const (
	StatusAssigned       = "assigned"
	StatusPickedUp       = "picked_up"
	StatusOutForDelivery = "out_for_delivery"
	StatusDelivered      = "delivered"
)

type Delivery struct {
	ID         string    `json:"id"`
	OrderID    string    `json:"order_id"`
	AgentID    string    `json:"agent_id"`
	AgentName  string    `json:"agent_name"`
	AgentEmail string    `json:"agent_email"`
	AgentPhone string    `json:"agent_phone"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

type UserCreatedEvent struct {
	Event     string `json:"event"`
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
}

type PaymentCompletedEvent struct {
	EventID     string  `json:"event_id"`
	PaymentID   string  `json:"payment_id"`
	OrderID     string  `json:"order_id"`
	CustomerID  string  `json:"customer_id"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	ProviderRef string  `json:"provider_ref"`
}

type DeliveryUpdatedEvent struct {
	EventID    string `json:"event_id"`
	DeliveryID string `json:"delivery_id"`
	OrderID    string `json:"order_id"`
	AgentID    string `json:"agent_id"`
	Status     string `json:"status"`
}

func ValidStatus(status string) bool {
	switch status {
	case StatusPickedUp, StatusOutForDelivery, StatusDelivered:
		return true
	default:
		return false
	}
}
