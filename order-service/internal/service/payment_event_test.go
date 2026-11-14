package service

import (
	"context"
	"sync"
	"testing"

	"github.com/google/uuid"

	"github.com/kathputli/order-service/internal/broker"
	"github.com/kathputli/order-service/internal/model"
	"github.com/kathputli/order-service/internal/repository"
)

type memoryOrderRepository struct {
	mu     sync.Mutex
	orders map[uuid.UUID]*model.Order
}

func newMemoryOrderRepository(order *model.Order) *memoryOrderRepository {
	return &memoryOrderRepository{orders: map[uuid.UUID]*model.Order{order.ID: order}}
}

func (r *memoryOrderRepository) Create(_ context.Context, order *model.Order) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.orders[order.ID] = order
	return nil
}

func (r *memoryOrderRepository) GetByID(_ context.Context, id uuid.UUID) (*model.Order, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	order, ok := r.orders[id]
	if !ok {
		return nil, repository.ErrNotFound
	}
	copy := *order
	return &copy, nil
}

func (r *memoryOrderRepository) ListByUser(_ context.Context, userID uuid.UUID) ([]model.Order, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	orders := make([]model.Order, 0)
	for _, order := range r.orders {
		if order.UserID == userID {
			orders = append(orders, *order)
		}
	}
	return orders, nil
}

func (r *memoryOrderRepository) UpdateStatus(_ context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	order, ok := r.orders[id]
	if !ok {
		return repository.ErrNotFound
	}
	order.Status = status
	return nil
}

func (r *memoryOrderRepository) UpdatePaymentStatus(_ context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	order, ok := r.orders[id]
	if !ok {
		return repository.ErrNotFound
	}
	if order.Status == model.StatusPendingPayment {
		order.Status = status
	}
	return nil
}

func paymentEvent(status string) model.PaymentEvent {
	return model.PaymentEvent{
		EventID: uuid.NewString(), PaymentID: uuid.NewString(), OrderID: uuid.NewString(),
		CustomerID: uuid.NewString(), Amount: 100, Currency: "INR", Status: status, Provider: "mock",
	}
}

func newTestOrder() *model.Order {
	return &model.Order{ID: uuid.New(), UserID: uuid.New(), Status: model.StatusPendingPayment}
}

func TestSuccessfulPaymentConfirmsOrder(t *testing.T) {
	order := newTestOrder()
	repo := newMemoryOrderRepository(order)
	svc := New(repo, nil, nil)
	event := paymentEvent("completed")
	event.OrderID = order.ID.String()

	if err := svc.HandlePaymentEvent(context.Background(), broker.PaymentCompletedSubject, event); err != nil {
		t.Fatal(err)
	}
	updated, err := repo.GetByID(context.Background(), order.ID)
	if err != nil {
		t.Fatal(err)
	}
	if updated.Status != model.StatusConfirmed {
		t.Fatalf("status = %q, want %q", updated.Status, model.StatusConfirmed)
	}
}

func TestFailedPaymentDoesNotConfirmOrder(t *testing.T) {
	order := newTestOrder()
	repo := newMemoryOrderRepository(order)
	svc := New(repo, nil, nil)
	event := paymentEvent("failed")
	event.OrderID = order.ID.String()

	if err := svc.HandlePaymentEvent(context.Background(), broker.PaymentFailedSubject, event); err != nil {
		t.Fatal(err)
	}
	updated, err := repo.GetByID(context.Background(), order.ID)
	if err != nil {
		t.Fatal(err)
	}
	if updated.Status != model.StatusPaymentFailed {
		t.Fatalf("status = %q, want %q", updated.Status, model.StatusPaymentFailed)
	}
}

func TestFailedStatusOnCompletionSubjectDoesNotConfirmOrder(t *testing.T) {
	order := newTestOrder()
	repo := newMemoryOrderRepository(order)
	svc := New(repo, nil, nil)
	event := paymentEvent("failed")
	event.OrderID = order.ID.String()

	if err := svc.HandlePaymentEvent(context.Background(), broker.PaymentCompletedSubject, event); err != nil {
		t.Fatal(err)
	}
	updated, err := repo.GetByID(context.Background(), order.ID)
	if err != nil {
		t.Fatal(err)
	}
	if updated.Status != model.StatusPendingPayment {
		t.Fatalf("status = %q, want %q for mismatched failure event", updated.Status, model.StatusPendingPayment)
	}
}

func TestDuplicatePaymentEventIsIdempotent(t *testing.T) {
	order := newTestOrder()
	repo := newMemoryOrderRepository(order)
	svc := New(repo, nil, nil)
	event := paymentEvent("completed")
	event.OrderID = order.ID.String()

	for i := 0; i < 2; i++ {
		if err := svc.HandlePaymentEvent(context.Background(), broker.PaymentCompletedSubject, event); err != nil {
			t.Fatalf("delivery %d: %v", i+1, err)
		}
	}
	updated, err := repo.GetByID(context.Background(), order.ID)
	if err != nil {
		t.Fatal(err)
	}
	if updated.Status != model.StatusConfirmed {
		t.Fatalf("status after duplicate event = %q, want %q", updated.Status, model.StatusConfirmed)
	}
}

func TestOrderRetrievalReturnsPersistedPaymentStatus(t *testing.T) {
	order := newTestOrder()
	repo := newMemoryOrderRepository(order)
	svc := New(repo, nil, nil)
	event := paymentEvent("completed")
	event.OrderID = order.ID.String()
	if err := svc.HandlePaymentEvent(context.Background(), broker.PaymentCompletedSubject, event); err != nil {
		t.Fatal(err)
	}

	got, err := svc.GetByID(context.Background(), order.ID, order.UserID)
	if err != nil {
		t.Fatal(err)
	}
	if got.Status != model.StatusConfirmed {
		t.Fatalf("retrieved status = %q, want persisted %q", got.Status, model.StatusConfirmed)
	}
}
