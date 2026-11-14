package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/kathputli/order-service/internal/model"
)

var ErrNotFound = errors.New("order not found")

type OrderRepository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *OrderRepository {
	return &OrderRepository{pool: pool}
}

func (r *OrderRepository) Create(ctx context.Context, order *model.Order) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var addrJSON []byte
	if order.ShippingAddress != nil {
		var err error
		addrJSON, err = json.Marshal(order.ShippingAddress)
		if err != nil {
			return fmt.Errorf("marshal shipping address: %w", err)
		}
	}

	_, err = tx.Exec(ctx, `
        INSERT INTO orders
            (id, user_id, artist_id, status, subtotal, shipping_amount, total_price, currency, shipping_address, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, order.ID, order.UserID, order.ArtistID, order.Status, order.Subtotal, order.ShippingAmount, order.TotalPrice,
		order.Currency, addrJSON, order.CreatedAt, order.UpdatedAt)
	if err != nil {
		return fmt.Errorf("insert order: %w", err)
	}

	for _, item := range order.Items {
		_, err = tx.Exec(ctx, `
            INSERT INTO order_items
                (id, order_id, artwork_id, title, quantity, unit_price, subtotal, currency)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, item.ID, item.OrderID, item.ArtworkID, item.Title, item.Quantity,
			item.UnitPrice, item.Subtotal, item.Currency)
		if err != nil {
			return fmt.Errorf("insert order item: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit order: %w", err)
	}
	return nil
}

func (r *OrderRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Order, error) {
	order := &model.Order{}
	var rawAddress []byte

	err := r.pool.QueryRow(ctx, `
        SELECT id,user_id,artist_id,status,subtotal,shipping_amount,total_price,currency,shipping_address,created_at,updated_at
        FROM orders WHERE id=$1
    `, id).Scan(
		&order.ID, &order.UserID, &order.ArtistID, &order.Status,
		&order.Subtotal, &order.ShippingAmount, &order.TotalPrice, &order.Currency, &rawAddress, &order.CreatedAt, &order.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get order: %w", err)
	}

	if len(rawAddress) > 0 && string(rawAddress) != "null" {
		var addr model.ShippingAddress
		if err := json.Unmarshal(rawAddress, &addr); err == nil {
			order.ShippingAddress = &addr
		}
	}

	items, err := r.getItems(ctx, order.ID)
	if err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}

func (r *OrderRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Order, error) {
	rows, err := r.pool.Query(ctx, `
        SELECT id,user_id,artist_id,status,subtotal,shipping_amount,total_price,currency,shipping_address,created_at,updated_at
        FROM orders WHERE user_id=$1 ORDER BY created_at DESC
    `, userID)
	if err != nil {
		return nil, fmt.Errorf("list orders: %w", err)
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var order model.Order
		var rawAddress []byte
		if err := rows.Scan(
			&order.ID, &order.UserID, &order.ArtistID, &order.Status,
			&order.Subtotal, &order.ShippingAmount, &order.TotalPrice, &order.Currency, &rawAddress, &order.CreatedAt, &order.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan order: %w", err)
		}

		if len(rawAddress) > 0 && string(rawAddress) != "null" {
			var addr model.ShippingAddress
			if err := json.Unmarshal(rawAddress, &addr); err == nil {
				order.ShippingAddress = &addr
			}
		}

		items, err := r.getItems(ctx, order.ID)
		if err != nil {
			return nil, err
		}
		order.Items = items
		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate orders: %w", err)
	}
	if orders == nil {
		orders = []model.Order{}
	}
	return orders, nil
}

func (r *OrderRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	result, err := r.pool.Exec(ctx, `
        UPDATE orders SET status=$2, updated_at=NOW() WHERE id=$1
    `, id, status)
	if err != nil {
		return fmt.Errorf("update order status: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// UpdatePaymentStatus applies a payment outcome only while the order is pending.
// Repeated or stale events are no-ops; missing orders and database failures are returned.
func (r *OrderRepository) UpdatePaymentStatus(ctx context.Context, id uuid.UUID, status string) error {
	if status != model.StatusConfirmed && status != model.StatusPaymentFailed {
		return fmt.Errorf("invalid payment-derived order status %q", status)
	}
	result, err := r.pool.Exec(ctx, `
		UPDATE orders
		SET status=$2, updated_at=NOW()
		WHERE id=$1 AND status=$3
	`, id, status, model.StatusPendingPayment)
	if err != nil {
		return fmt.Errorf("apply payment status to order: %w", err)
	}
	if result.RowsAffected() > 0 {
		return nil
	}

	var currentStatus string
	if err := r.pool.QueryRow(ctx, `SELECT status FROM orders WHERE id=$1`, id).Scan(&currentStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("read order status after payment event: %w", err)
	}
	// The same outcome is a duplicate. A different non-pending state means
	// the event is stale or the order was already cancelled; do not overwrite it.
	return nil
}

func (r *OrderRepository) getItems(ctx context.Context, orderID uuid.UUID) ([]model.OrderItem, error) {
	rows, err := r.pool.Query(ctx, `
        SELECT id,order_id,artwork_id,title,quantity,unit_price,subtotal,currency
        FROM order_items WHERE order_id=$1 ORDER BY id
    `, orderID)
	if err != nil {
		return nil, fmt.Errorf("get order items: %w", err)
	}
	defer rows.Close()

	var items []model.OrderItem
	for rows.Next() {
		var item model.OrderItem
		if err := rows.Scan(
			&item.ID, &item.OrderID, &item.ArtworkID, &item.Title,
			&item.Quantity, &item.UnitPrice, &item.Subtotal, &item.Currency,
		); err != nil {
			return nil, fmt.Errorf("scan order item: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate order items: %w", err)
	}
	if items == nil {
		items = []model.OrderItem{}
	}
	return items, nil
}
