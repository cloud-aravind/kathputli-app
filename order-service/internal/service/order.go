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
	"github.com/kathputli/order-service/internal/repository"
)

var (
	ErrForbidden         = errors.New("forbidden")
	ErrInvalidRequest    = errors.New("invalid order request")
	ErrArtworkInactive   = errors.New("artwork is inactive")
	ErrInsufficientStock = errors.New("insufficient artwork stock")
	ErrArtistMismatch    = errors.New("order items must belong to the same artist")
)

type OrderService struct {
	repo          *repository.OrderRepository
	artworkClient *client.ArtworkClient
	broker        *broker.Broker
}

func New(repo *repository.OrderRepository, artworkClient *client.ArtworkClient, b *broker.Broker) *OrderService {
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
		Items: []model.OrderItem{}, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}

	var total float64
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

		subtotal := artwork.Price * float64(requestedItem.Quantity)
		order.Items = append(order.Items, model.OrderItem{
			ID: uuid.New(), OrderID: order.ID, ArtworkID: artwork.ID,
			Title: artwork.Title, Quantity: requestedItem.Quantity,
			UnitPrice: artwork.Price, Subtotal: subtotal, Currency: artwork.Currency,
		})
		total += subtotal
	}

	order.TotalPrice = total

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
