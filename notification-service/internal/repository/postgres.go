package repository

import (
    "context"
    "errors"
    "fmt"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"

    "github.com/kathputli/notification-service/internal/migrations"
    "github.com/kathputli/notification-service/internal/model"
)

var ErrNotFound = errors.New("notification not found")

type Repository struct {
    db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
    return &Repository{db: db}
}

func RunMigrations(ctx context.Context, db *pgxpool.Pool) error {
    if _, err := db.Exec(ctx, migrations.CreateNotificationsSQL); err != nil {
        return fmt.Errorf("run notifications migration: %w", err)
    }
    return nil
}

func (r *Repository) Create(ctx context.Context, n *model.Notification) error {
    id, err := uuid.Parse(n.ID)
    if err != nil {
        return fmt.Errorf("invalid notification id: %w", err)
    }

    userID, err := uuid.Parse(n.UserID)
    if err != nil {
        return fmt.Errorf("invalid user id: %w", err)
    }

    var reference any
    if n.ReferenceID != "" {
        referenceID, err := uuid.Parse(n.ReferenceID)
        if err != nil {
            return fmt.Errorf("invalid reference id: %w", err)
        }
        reference = referenceID
    }

    _, err = r.db.Exec(
        ctx,
        `
        INSERT INTO notifications (
            id,
            user_id,
            type,
            title,
            message,
            reference_id,
            is_read
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
        `,
        id,
        userID,
        n.Type,
        n.Title,
        n.Message,
        reference,
        n.IsRead,
    )
    if err != nil {
        return fmt.Errorf("create notification: %w", err)
    }

    return nil
}

func (r *Repository) ListByUser(
    ctx context.Context,
    userID string,
) ([]model.Notification, error) {
    parsedUserID, err := uuid.Parse(userID)
    if err != nil {
        return nil, fmt.Errorf("invalid user id: %w", err)
    }

    rows, err := r.db.Query(
        ctx,
        `
        SELECT
            id,
            user_id,
            type,
            title,
            message,
            COALESCE(reference_id::text, ''),
            is_read,
            created_at,
            updated_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        parsedUserID,
    )
    if err != nil {
        return nil, fmt.Errorf("list notifications: %w", err)
    }
    defer rows.Close()

    notifications := make([]model.Notification, 0)

    for rows.Next() {
        var n model.Notification

        if err := rows.Scan(
            &n.ID,
            &n.UserID,
            &n.Type,
            &n.Title,
            &n.Message,
            &n.ReferenceID,
            &n.IsRead,
            &n.CreatedAt,
            &n.UpdatedAt,
        ); err != nil {
            return nil, fmt.Errorf("scan notification: %w", err)
        }

        notifications = append(notifications, n)
    }

    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("notification rows: %w", err)
    }

    return notifications, nil
}

func (r *Repository) GetByID(
    ctx context.Context,
    id string,
) (*model.Notification, error) {
    notificationID, err := uuid.Parse(id)
    if err != nil {
        return nil, fmt.Errorf("invalid notification id: %w", err)
    }

    var n model.Notification

    err = r.db.QueryRow(
        ctx,
        `
        SELECT
            id,
            user_id,
            type,
            title,
            message,
            COALESCE(reference_id::text, ''),
            is_read,
            created_at,
            updated_at
        FROM notifications
        WHERE id = $1
        `,
        notificationID,
    ).Scan(
        &n.ID,
        &n.UserID,
        &n.Type,
        &n.Title,
        &n.Message,
        &n.ReferenceID,
        &n.IsRead,
        &n.CreatedAt,
        &n.UpdatedAt,
    )

    if errors.Is(err, pgx.ErrNoRows) {
        return nil, ErrNotFound
    }

    if err != nil {
        return nil, fmt.Errorf("get notification: %w", err)
    }

    return &n, nil
}

func (r *Repository) MarkRead(
    ctx context.Context,
    id string,
) error {
    notificationID, err := uuid.Parse(id)
    if err != nil {
        return fmt.Errorf("invalid notification id: %w", err)
    }

    result, err := r.db.Exec(
        ctx,
        `
        UPDATE notifications
        SET
            is_read = TRUE,
            updated_at = NOW()
        WHERE id = $1
        `,
        notificationID,
    )
    if err != nil {
        return fmt.Errorf("mark notification read: %w", err)
    }

    if result.RowsAffected() == 0 {
        return ErrNotFound
    }

    return nil
}
