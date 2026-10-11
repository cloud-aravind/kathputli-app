package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"

	"github.com/kathputli/payment-service/internal/broker"
	"github.com/kathputli/payment-service/internal/model"
	"github.com/kathputli/payment-service/internal/repository"
)

var (
	ErrUnauthorized = errors.New("payment does not belong to customer")
	ErrAlreadyPaid  = errors.New("order already has a payment")
)

type Service struct {
	repo *repository.Repository
	js   nats.JetStreamContext
}

func New(
	repo *repository.Repository,
	js nats.JetStreamContext,
) *Service {
	return &Service{
		repo: repo,
		js:   js,
	}
}

// CreatePayment creates a payment through the API.
//
// The payment amount is never accepted from the client.
// The amount comes from the order.placed event.
func (s *Service) CreatePayment(
	ctx context.Context,
	customerID string,
	req model.CreatePaymentRequest,
) (*model.Payment, error) {

	if _, err := uuid.Parse(req.OrderID); err != nil {
		return nil, errors.New("invalid order_id")
	}

	if req.Method == "" {
		req.Method = "mock"
	}

	existing, err := s.repo.GetByOrderID(
		ctx,
		req.OrderID,
	)

	if err == nil {
		if existing.CustomerID != customerID {
			return nil, ErrUnauthorized
		}

		return nil, ErrAlreadyPaid
	}

	if !errors.Is(err, repository.ErrNotFound) {
		return nil, err
	}

	// Payment records are initialized asynchronously when
	// Payment Service consumes the order.placed event.
	//
	// We intentionally do not accept the payment amount from
	// the client because the Order Service is the source of
	// truth for the order total.

	return nil, errors.New(
		"payment for order has not been initialized yet",
	)
}

// GetPayment returns a payment only if it belongs to
// the authenticated customer.
func (s *Service) GetPayment(
	ctx context.Context,
	customerID string,
	id string,
) (*model.Payment, error) {

	payment, err := s.repo.GetByID(
		ctx,
		id,
	)
	if err != nil {
		return nil, err
	}

	if payment.CustomerID != customerID {
		return nil, ErrUnauthorized
	}

	return payment, nil
}

// GetPaymentByOrder returns the payment associated with
// an order, provided the order belongs to the customer.
func (s *Service) GetPaymentByOrder(
	ctx context.Context,
	customerID string,
	orderID string,
) (*model.Payment, error) {

	payment, err := s.repo.GetByOrderID(
		ctx,
		orderID,
	)
	if err != nil {
		return nil, err
	}

	if payment.CustomerID != customerID {
		return nil, ErrUnauthorized
	}

	return payment, nil
}

// HandleOrderPlaced consumes the Order Service's
// order.placed event and creates the initial payment.
//
// Order Service event:
//
//	{
//	  "order_id": "...",
//	  "user_id": "...",
//	  "artist_id": "...",
//	  "total_price": 6000,
//	  "currency": "INR"
//	}
//
// Payment Service maps:
//
// user_id     -> customer_id
// total_price -> amount
func (s *Service) HandleOrderPlaced(
	event model.OrderPlacedEvent,
) error {

	if event.OrderID == "" {
		return errors.New(
			"order.placed missing order id",
		)
	}

	if event.UserID == "" {
		return errors.New(
			"order.placed missing user id",
		)
	}

	// Check whether this event has already been processed.
	//
	// This makes the consumer idempotent because NATS
	// JetStream provides at-least-once delivery.
	_, err := s.repo.GetByOrderID(
		context.Background(),
		event.OrderID,
	)

	if err == nil {
		// Payment already exists.
		return nil
	}

	if !errors.Is(err, repository.ErrNotFound) {
		return err
	}

	payment := &model.Payment{
		ID:         uuid.NewString(),
		OrderID:    event.OrderID,
		CustomerID: event.UserID,
		Amount:     event.TotalPrice,
		Currency:   event.Currency,
		Method:     "mock",
		Status:     model.StatusPending,
		Provider:   "mock",
	}

	if err := s.repo.Create(
		context.Background(),
		payment,
	); err != nil {
		return err
	}

	// Notify downstream services that the payment record
	// has been created.
	return broker.PublishPaymentEvent(
		s.js,
		broker.PaymentCreated,
		model.PaymentEvent{
			EventID:    broker.NewEventID(),
			PaymentID:  payment.ID,
			OrderID:    payment.OrderID,
			CustomerID: payment.CustomerID,
			Amount:     payment.Amount,
			Currency:   payment.Currency,
			Status:     payment.Status,
			Provider:   payment.Provider,
		},
	)
}

// CompleteMockPayment simulates a successful payment.
//
// This is intentionally provider-neutral. A real payment
// gateway can be integrated later without changing the
// Order Service.
func (s *Service) CompleteMockPayment(
	ctx context.Context,
	customerID string,
	id string,
) (*model.Payment, error) {

	payment, err := s.GetPayment(
		ctx,
		customerID,
		id,
	)
	if err != nil {
		return nil, err
	}

	if payment.Status != model.StatusPending {
		return nil, fmt.Errorf(
			"payment is already %s",
			payment.Status,
		)
	}

	providerRef := "MOCK-" + uuid.NewString()

	if err := s.repo.UpdateStatus(
		ctx,
		payment.ID,
		model.StatusCompleted,
		providerRef,
		"",
	); err != nil {
		return nil, err
	}

	payment.Status = model.StatusCompleted
	payment.ProviderRef = providerRef

	if err := broker.PublishPaymentEvent(
		s.js,
		broker.PaymentCompleted,
		model.PaymentEvent{
			EventID:     broker.NewEventID(),
			PaymentID:   payment.ID,
			OrderID:     payment.OrderID,
			CustomerID:  payment.CustomerID,
			Amount:      payment.Amount,
			Currency:    payment.Currency,
			Status:      payment.Status,
			Provider:    payment.Provider,
			ProviderRef: payment.ProviderRef,
		},
	); err != nil {
		return nil, err
	}

	return payment, nil
}
