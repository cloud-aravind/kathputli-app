package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/kathputli/delivery-service/internal/broker"
	"github.com/kathputli/delivery-service/internal/client"
	"github.com/kathputli/delivery-service/internal/model"
	"github.com/kathputli/delivery-service/internal/repository"
)

var (
	ErrInvalidStatus     = errors.New("invalid delivery status")
	ErrNotAssigned       = errors.New("delivery is not assigned to this agent")
	ErrInvalidTransition = errors.New("invalid delivery status transition")
	ErrOrderNotFound     = errors.New("order not found or not owned by customer")
	ErrDeliveryNotFound  = errors.New("delivery not found")
	ErrOrderServiceDown  = errors.New("order ownership verification unavailable")
)

type Service struct {
	repo   *repository.Repository
	broker *broker.Broker
	orders *client.OrderService
}

func New(repo *repository.Repository, broker *broker.Broker, orders *client.OrderService) *Service {
	return &Service{repo: repo, broker: broker, orders: orders}
}

func (s *Service) HandleUserCreated(ctx context.Context, event model.UserCreatedEvent) error {
	if event.Role != "delivery-agent" {
		return nil
	}

	if err := s.repo.UpsertAgentFromUser(ctx, event); err != nil {
		return fmt.Errorf("provision delivery agent: %w", err)
	}

	log.Printf("delivery agent provisioned: user_id=%s email=%s", event.UserID, event.Email)
	return nil
}

func (s *Service) HandlePaymentCompleted(ctx context.Context, event model.PaymentCompletedEvent) error {
	if event.OrderID == "" {
		return errors.New("payment event missing order_id")
	}

	delivery, err := s.repo.CreateDelivery(ctx, event.OrderID)
	if err != nil {
		return fmt.Errorf("create delivery: %w", err)
	}

	s.publishUpdated(delivery)

	log.Printf(
		"delivery assigned: order_id=%s delivery_id=%s agent_id=%s",
		delivery.OrderID, delivery.ID, delivery.AgentID,
	)

	return nil
}

func (s *Service) UpdateStatus(ctx context.Context, id string, status string, userID string) (*model.Delivery, error) {
	if !model.ValidStatus(status) {
		return nil, ErrInvalidStatus
	}

	delivery, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if delivery.AgentID != userID {
		return nil, ErrNotAssigned
	}

	if !validTransition(delivery.Status, status) {
		return nil, ErrInvalidTransition
	}

	delivery, err = s.repo.UpdateStatus(ctx, id, status)
	if err != nil {
		return nil, err
	}

	s.publishUpdated(delivery)
	return delivery, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*model.Delivery, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetByOrderID(ctx context.Context, orderID, authorization string) (*model.Delivery, error) {
	if err := s.orders.VerifyOwnership(ctx, orderID, authorization); err != nil {
		if errors.Is(err, client.ErrOrderNotFound) {
			return nil, ErrOrderNotFound
		}
		return nil, fmt.Errorf("%w: %v", ErrOrderServiceDown, err)
	}
	delivery, err := s.repo.GetByOrderID(ctx, orderID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDeliveryNotFound
	}
	return delivery, err
}

func (s *Service) publishUpdated(delivery *model.Delivery) {
	event := model.DeliveryUpdatedEvent{
		EventID:    uuid.New().String(),
		DeliveryID: delivery.ID,
		OrderID:    delivery.OrderID,
		AgentID:    delivery.AgentID,
		Status:     delivery.Status,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		log.Printf("delivery.updated marshal failed: %v", err)
		return
	}

	if err := s.broker.Publish("delivery.updated", payload); err != nil {
		log.Printf("delivery.updated publish failed: %v", err)
	}
}

func validTransition(current, next string) bool {
	switch current {
	case model.StatusAssigned:
		return next == model.StatusPickedUp
	case model.StatusPickedUp:
		return next == model.StatusOutForDelivery
	case model.StatusOutForDelivery:
		return next == model.StatusDelivered
	default:
		return false
	}
}
