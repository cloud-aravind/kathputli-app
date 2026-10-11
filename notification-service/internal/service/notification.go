package service

import (
    "context"
    "errors"
    "fmt"

    "github.com/google/uuid"

    "github.com/kathputli/notification-service/internal/model"
    "github.com/kathputli/notification-service/internal/repository"
)

var ErrUnauthorized = errors.New("unauthorized")

type Service struct {
    repo *repository.Repository
}

func New(repo *repository.Repository) *Service {
    return &Service{repo: repo}
}

func (s *Service) CreateFromOrderPlaced(
    ctx context.Context,
    event model.OrderPlacedEvent,
) error {
    if event.UserID == "" || event.OrderID == "" {
        return errors.New("order.placed missing user_id or order_id")
    }

    notification := &model.Notification{
        ID:          uuid.NewString(),
        UserID:      event.UserID,
        Type:        "order_placed",
        Title:       "Order placed",
        Message:     fmt.Sprintf(
            "Your order %s has been placed successfully.",
            event.OrderID,
        ),
        ReferenceID: event.OrderID,
        IsRead:      false,
    }

    return s.repo.Create(ctx, notification)
}

func (s *Service) CreateFromPaymentCompleted(
    ctx context.Context,
    event model.PaymentCompletedEvent,
) error {
    if event.CustomerID == "" || event.OrderID == "" {
        return errors.New(
            "payment.completed missing customer_id or order_id",
        )
    }

    notification := &model.Notification{
        ID:          uuid.NewString(),
        UserID:      event.CustomerID,
        Type:        "payment_completed",
        Title:       "Payment completed",
        Message: fmt.Sprintf(
            "Payment for order %s was completed successfully.",
            event.OrderID,
        ),
        ReferenceID: event.OrderID,
        IsRead:      false,
    }

    return s.repo.Create(ctx, notification)
}

func (s *Service) List(
    ctx context.Context,
    userID string,
) ([]model.Notification, error) {
    return s.repo.ListByUser(ctx, userID)
}

func (s *Service) Get(
    ctx context.Context,
    userID string,
    notificationID string,
) (*model.Notification, error) {
    n, err := s.repo.GetByID(ctx, notificationID)
    if err != nil {
        return nil, err
    }

    if n.UserID != userID {
        return nil, ErrUnauthorized
    }

    return n, nil
}

func (s *Service) MarkRead(
    ctx context.Context,
    userID string,
    notificationID string,
) error {
    n, err := s.repo.GetByID(ctx, notificationID)
    if err != nil {
        return err
    }

    if n.UserID != userID {
        return ErrUnauthorized
    }

    return s.repo.MarkRead(ctx, notificationID)
}
