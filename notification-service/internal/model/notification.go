package model

import "time"

type Notification struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    Type      string    `json:"type"`
    Title     string    `json:"title"`
    Message   string    `json:"message"`
    ReferenceID string  `json:"reference_id,omitempty"`
    IsRead    bool      `json:"is_read"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type OrderPlacedEvent struct {
    EventID    string `json:"event_id"`
    OrderID    string `json:"order_id"`
    UserID     string `json:"user_id"`
    ArtistID   string `json:"artist_id"`
    TotalPrice float64 `json:"total_price"`
    Currency   string `json:"currency"`
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
