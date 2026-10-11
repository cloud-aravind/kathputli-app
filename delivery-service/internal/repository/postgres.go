package repository

import (
	"context"
	"fmt"
	"io/fs"
	"sort"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/kathputli/delivery-service/internal/model"
)

type Repository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func RunMigrations(ctx context.Context, db *pgxpool.Pool, migrations fs.FS) error {
	entries, err := fs.ReadDir(migrations, ".")
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	var names []string
	for _, entry := range entries {
		if !entry.IsDir() {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names)

	for _, name := range names {
		content, err := fs.ReadFile(migrations, name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		if _, err := db.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("apply migration %s: %w", name, err)
		}
	}

	return nil
}

// UpsertAgentFromUser provisions a delivery agent from the canonical user.created event.
// The delivery service owns operational fields such as availability, while Auth owns identity.
func (r *Repository) UpsertAgentFromUser(ctx context.Context, event model.UserCreatedEvent) error {
	userID, err := uuid.Parse(event.UserID)
	if err != nil {
		return fmt.Errorf("invalid delivery agent user id: %w", err)
	}

	if event.Name == "" || event.Email == "" {
		return fmt.Errorf("delivery agent event missing name or email")
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO delivery_agents (id, user_id, name, email, phone, is_available)
		VALUES ($1, $1, $2, $3, '', TRUE)
		ON CONFLICT (user_id) DO UPDATE
		SET name = EXCLUDED.name,
			email = EXCLUDED.email,
			updated_at = NOW()
	`, userID, event.Name, event.Email)
	if err != nil {
		return fmt.Errorf("upsert delivery agent: %w", err)
	}

	return nil
}

func (r *Repository) CreateDelivery(ctx context.Context, orderID string) (*model.Delivery, error) {
	orderUUID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var existing model.Delivery
	err = tx.QueryRow(ctx, `
		SELECT d.id, d.order_id, d.agent_id, a.name, a.email, a.phone,
		       d.status, d.created_at, d.updated_at
		FROM deliveries d
		JOIN delivery_agents a ON a.id = d.agent_id
		WHERE d.order_id = $1
	`, orderUUID).Scan(
		&existing.ID, &existing.OrderID, &existing.AgentID,
		&existing.AgentName, &existing.AgentEmail, &existing.AgentPhone,
		&existing.Status, &existing.CreatedAt, &existing.UpdatedAt,
	)

	if err == nil {
		return &existing, nil
	}
	if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("check existing delivery: %w", err)
	}

	// Only agents linked to a real Auth user can receive new deliveries.
	// SKIP LOCKED allows multiple delivery events to assign agents safely in parallel.
	var agentID uuid.UUID
	err = tx.QueryRow(ctx, `
		SELECT id
		FROM delivery_agents
		WHERE user_id IS NOT NULL
		  AND is_available = TRUE
		ORDER BY created_at
		LIMIT 1
		FOR UPDATE SKIP LOCKED
	`).Scan(&agentID)
	if err != nil {
		return nil, fmt.Errorf("no available delivery agent: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE delivery_agents
		SET is_available = FALSE, updated_at = NOW()
		WHERE id = $1
	`, agentID); err != nil {
		return nil, fmt.Errorf("mark agent unavailable: %w", err)
	}

	deliveryID := uuid.New()

	if _, err := tx.Exec(ctx, `
		INSERT INTO deliveries (id, order_id, agent_id, status)
		VALUES ($1, $2, $3, $4)
	`, deliveryID, orderUUID, agentID, model.StatusAssigned); err != nil {
		return nil, fmt.Errorf("create delivery: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit delivery: %w", err)
	}

	return r.GetByID(ctx, deliveryID.String())
}

func (r *Repository) GetByID(ctx context.Context, id string) (*model.Delivery, error) {
	deliveryUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid delivery id: %w", err)
	}

	var delivery model.Delivery
	err = r.db.QueryRow(ctx, `
		SELECT d.id, d.order_id, d.agent_id, a.name, a.email, a.phone,
		       d.status, d.created_at, d.updated_at
		FROM deliveries d
		JOIN delivery_agents a ON a.id = d.agent_id
		WHERE d.id = $1
	`, deliveryUUID).Scan(
		&delivery.ID, &delivery.OrderID, &delivery.AgentID,
		&delivery.AgentName, &delivery.AgentEmail, &delivery.AgentPhone,
		&delivery.Status, &delivery.CreatedAt, &delivery.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &delivery, nil
}

func (r *Repository) GetByOrderID(ctx context.Context, orderID string) (*model.Delivery, error) {
	orderUUID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	var delivery model.Delivery
	err = r.db.QueryRow(ctx, `
		SELECT d.id, d.order_id, d.agent_id, a.name, a.email, a.phone,
		       d.status, d.created_at, d.updated_at
		FROM deliveries d
		JOIN delivery_agents a ON a.id = d.agent_id
		WHERE d.order_id = $1
	`, orderUUID).Scan(
		&delivery.ID, &delivery.OrderID, &delivery.AgentID,
		&delivery.AgentName, &delivery.AgentEmail, &delivery.AgentPhone,
		&delivery.Status, &delivery.CreatedAt, &delivery.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &delivery, nil
}

func (r *Repository) UpdateStatus(ctx context.Context, id string, status string) (*model.Delivery, error) {
	deliveryUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid delivery id: %w", err)
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var delivery model.Delivery
	err = tx.QueryRow(ctx, `
		UPDATE deliveries
		SET status = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, order_id, agent_id, status, created_at, updated_at
	`, status, deliveryUUID).Scan(
		&delivery.ID, &delivery.OrderID, &delivery.AgentID,
		&delivery.Status, &delivery.CreatedAt, &delivery.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if status == model.StatusDelivered {
		if _, err := tx.Exec(ctx, `
			UPDATE delivery_agents
			SET is_available = TRUE, updated_at = NOW()
			WHERE id = $1
		`, delivery.AgentID); err != nil {
			return nil, fmt.Errorf("free delivery agent: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit status update: %w", err)
	}

	return r.GetByID(ctx, delivery.ID)
}
