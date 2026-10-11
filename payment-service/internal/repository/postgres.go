package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/kathputli/payment-service/internal/model"
)

var ErrNotFound = errors.New("payment not found")

type Repository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{
		db: db,
	}
}

func (r *Repository) Create(
	ctx context.Context,
	p *model.Payment,
) error {

	_, err := r.db.Exec(
		ctx,
		`
		INSERT INTO payments (
			id,
			order_id,
			customer_id,
			amount,
			currency,
			method,
			status,
			provider,
			provider_ref,
			failure_reason
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			$8,
			$9,
			$10
		)
		ON CONFLICT (order_id) DO NOTHING
		`,
		uuid.MustParse(p.ID),
		uuid.MustParse(p.OrderID),
		uuid.MustParse(p.CustomerID),
		p.Amount,
		p.Currency,
		p.Method,
		p.Status,
		p.Provider,
		nullString(p.ProviderRef),
		nullString(p.FailureReason),
	)

	if err != nil {
		return fmt.Errorf(
			"create payment: %w",
			err,
		)
	}

	return nil
}

func (r *Repository) GetByID(
	ctx context.Context,
	id string,
) (*model.Payment, error) {

	// Validate that the supplied payment ID is a UUID.
	if _, err := uuid.Parse(id); err != nil {
		return nil, fmt.Errorf(
			"invalid payment id: %w",
			err,
		)
	}

	payment := &model.Payment{}

	err := r.db.QueryRow(
		ctx,
		`
		SELECT
			id,
			order_id,
			customer_id,
			amount,
			currency,
			method,
			status,
			provider,
			COALESCE(provider_ref, ''),
			COALESCE(failure_reason, ''),
			created_at,
			updated_at
		FROM payments
		WHERE id::text = $1
		`,
		id,
	).Scan(
		&payment.ID,
		&payment.OrderID,
		&payment.CustomerID,
		&payment.Amount,
		&payment.Currency,
		&payment.Method,
		&payment.Status,
		&payment.Provider,
		&payment.ProviderRef,
		&payment.FailureReason,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}

	if err != nil {
		return nil, fmt.Errorf(
			"get payment: %w",
			err,
		)
	}

	return payment, nil
}

func (r *Repository) GetByOrderID(
	ctx context.Context,
	orderID string,
) (*model.Payment, error) {

	parsedOrderID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf(
			"invalid order id: %w",
			err,
		)
	}

	payment := &model.Payment{}

	err = r.db.QueryRow(
		ctx,
		`
		SELECT
			id,
			order_id,
			customer_id,
			amount,
			currency,
			method,
			status,
			provider,
			COALESCE(provider_ref, ''),
			COALESCE(failure_reason, ''),
			created_at,
			updated_at
		FROM payments
		WHERE order_id = $1
		`,
		parsedOrderID,
	).Scan(
		&payment.ID,
		&payment.OrderID,
		&payment.CustomerID,
		&payment.Amount,
		&payment.Currency,
		&payment.Method,
		&payment.Status,
		&payment.Provider,
		&payment.ProviderRef,
		&payment.FailureReason,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}

	if err != nil {
		return nil, fmt.Errorf(
			"get payment by order: %w",
			err,
		)
	}

	return payment, nil
}

func (r *Repository) UpdateStatus(
	ctx context.Context,
	id string,
	status string,
	providerRef string,
	failureReason string,
) error {

	paymentID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf(
			"invalid payment id: %w",
			err,
		)
	}

	_, err = r.db.Exec(
		ctx,
		`
		UPDATE payments
		SET
			status = $2,
			provider_ref = NULLIF($3, ''),
			failure_reason = NULLIF($4, ''),
			updated_at = NOW()
		WHERE id = $1
		`,
		paymentID,
		status,
		providerRef,
		failureReason,
	)

	if err != nil {
		return fmt.Errorf(
			"update payment: %w",
			err,
		)
	}

	return nil
}

func nullString(value string) any {
	if value == "" {
		return nil
	}

	return value
}
