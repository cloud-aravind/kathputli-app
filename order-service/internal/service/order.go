package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/kathputli/order-service/internal/broker"
	"github.com/kathputli/order-service/internal/client"
	"github.com/kathputli/order-service/internal/model"
)

var (
	ErrForbidden         = errors.New("forbidden")
	ErrInvalidRequest    = errors.New("invalid order request")
	ErrArtworkInactive   = errors.New("artwork is inactive")
	ErrInsufficientStock = errors.New("insufficient artwork stock")
	ErrArtistMismatch    = errors.New("order items must belong to the same artist")
)

const (
	ShippingFee           = 50.0
	FreeShippingThreshold = 2000.0
)

func orderTotalsFor(subtotal float64) (shippingAmount, totalPrice float64) {
	if subtotal <= 0 || subtotal >= FreeShippingThreshold {
		return 0, subtotal
	}
	return ShippingFee, subtotal + ShippingFee
}

type OrderService struct {
	repo          orderRepository
	artworkClient *client.ArtworkClient
	broker        *broker.Broker
}

type orderRepository interface {
	Create(context.Context, *model.Order) error
	GetByID(context.Context, uuid.UUID) (*model.Order, error)
	ListByUser(context.Context, uuid.UUID) ([]model.Order, error)
	UpdateStatus(context.Context, uuid.UUID, string) error
	UpdatePaymentStatus(context.Context, uuid.UUID, string) error
}

func New(repo orderRepository, artworkClient *client.ArtworkClient, b *broker.Broker) *OrderService {
	return &OrderService{repo: repo, artworkClient: artworkClient, broker: b}
}

func (s *OrderService) Create(ctx context.Context, userID uuid.UUID, req model.CreateOrderRequest) (*model.Order, error) {
	if userID == uuid.Nil {
		return nil, ErrForbidden
	}
	if len(req.Items) == 0 {
		return nil, ErrInvalidRequest
	}

	order := &model.Order{
		ID: uuid.New(), UserID: userID,
		Status: model.StatusPendingPayment, Currency: "INR",
		Items: []model.OrderItem{}, ShippingAddress: req.ShippingAddress,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}

	var subtotal float64
	var artistID uuid.UUID

	for _, requestedItem := range req.Items {
		if requestedItem.ArtworkID == uuid.Nil || requestedItem.Quantity <= 0 {
			return nil, ErrInvalidRequest
		}

		artwork, err := s.artworkClient.GetArtwork(ctx, requestedItem.ArtworkID)
		if err != nil {
			return nil, fmt.Errorf("validate artwork %s: %w", requestedItem.ArtworkID, err)
		}
		if artistID == uuid.Nil {
			artistID = artwork.ArtistID
			order.ArtistID = artistID
		} else if artwork.ArtistID != artistID {
			return nil, ErrArtistMismatch
		}
		if !artwork.IsActive {
			return nil, ErrArtworkInactive
		}
		if requestedItem.Quantity > artwork.Stock {
			return nil, ErrInsufficientStock
		}

		itemSubtotal := artwork.Price * float64(requestedItem.Quantity)
		order.Items = append(order.Items, model.OrderItem{
			ID: uuid.New(), OrderID: order.ID, ArtworkID: artwork.ID,
			Title: artwork.Title, Quantity: requestedItem.Quantity,
			UnitPrice: artwork.Price, Subtotal: itemSubtotal, Currency: artwork.Currency,
		})
		subtotal += itemSubtotal
	}

	order.Subtotal = subtotal
	order.ShippingAmount, order.TotalPrice = orderTotalsFor(order.Subtotal)

	if err := s.repo.Create(ctx, order); err != nil {
		return nil, err
	}

	event := model.OrderPlacedEvent{
		EventID: uuid.New().String(),
		OrderID: order.ID.String(), UserID: order.UserID.String(),
		ArtistID: order.ArtistID.String(), TotalPrice: order.TotalPrice,
		Currency: order.Currency, Status: order.Status,
		CreatedAt: order.CreatedAt.Format(time.RFC3339),
	}

	if err := s.broker.PublishOrderPlaced(event); err != nil {
		return nil, fmt.Errorf("order created but event publication failed: %w", err)
	}

	return order, nil
}

func (s *OrderService) GetByID(ctx context.Context, orderID, userID uuid.UUID) (*model.Order, error) {
	order, err := s.repo.GetByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order.UserID != userID {
		return nil, ErrForbidden
	}
	return order, nil
}

func (s *OrderService) ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Order, error) {
	if userID == uuid.Nil {
		return nil, ErrForbidden
	}
	return s.repo.ListByUser(ctx, userID)
}

func (s *OrderService) HandlePaymentEvent(ctx context.Context, subject string, event model.PaymentEvent) error {
	var orderStatus string
	switch subject {
	case broker.PaymentCompletedSubject:
		if event.Status != "completed" {
			return nil
		}
		orderStatus = model.StatusConfirmed
	case broker.PaymentFailedSubject:
		if event.Status != "failed" {
			return nil
		}
		orderStatus = model.StatusPaymentFailed
	default:
		// payment.created and other payment events do not change order status.
		return nil
	}

	orderID, err := uuid.Parse(event.OrderID)
	if err != nil {
		return fmt.Errorf("invalid order_id in %s event: %w", subject, err)
	}
	if _, err := uuid.Parse(event.EventID); err != nil {
		return fmt.Errorf("invalid event_id in %s event: %w", subject, err)
	}
	if _, err := uuid.Parse(event.PaymentID); err != nil {
		return fmt.Errorf("invalid payment_id in %s event: %w", subject, err)
	}

	return s.repo.UpdatePaymentStatus(ctx, orderID, orderStatus)
}

func (s *OrderService) UpdateStatus(ctx context.Context, orderID, userID uuid.UUID, status string) (*model.Order, error) {
	status = strings.TrimSpace(status)

	if status != model.StatusCancelled {
		return nil, fmt.Errorf("%w: customers can only cancel an order", ErrForbidden)
	}

	order, err := s.repo.GetByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order.UserID != userID {
		return nil, ErrForbidden
	}
	if order.Status == model.StatusDelivered || order.Status == model.StatusCancelled {
		return nil, fmt.Errorf("%w: order cannot be changed from %s", ErrInvalidRequest, order.Status)
	}

	if err := s.repo.UpdateStatus(ctx, orderID, status); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, orderID)
}
