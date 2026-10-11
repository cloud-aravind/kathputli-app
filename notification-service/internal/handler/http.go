package handler

import (
    "encoding/json"
    "errors"
    "net/http"
    "strings"

    "github.com/golang-jwt/jwt/v5"

    "github.com/kathputli/notification-service/internal/repository"
    "github.com/kathputli/notification-service/internal/service"
)

type Handler struct {
    svc       *service.Service
    jwtSecret string
}

func New(svc *service.Service, jwtSecret string) *Handler {
    return &Handler{
        svc:       svc,
        jwtSecret: jwtSecret,
    }
}

func (h *Handler) Routes() http.Handler {
    mux := http.NewServeMux()

    mux.HandleFunc("/healthz", h.healthz)
    mux.HandleFunc("/readyz", h.readyz)
    mux.HandleFunc("/api/notifications", h.notifications)
    mux.HandleFunc("/api/notifications/", h.notificationByID)

    return mux
}

func (h *Handler) healthz(w http.ResponseWriter, _ *http.Request) {
    writeJSON(w, http.StatusOK, map[string]string{
        "status": "ok",
    })
}

func (h *Handler) readyz(w http.ResponseWriter, _ *http.Request) {
    writeJSON(w, http.StatusOK, map[string]string{
        "status": "ready",
    })
}

func (h *Handler) notifications(
    w http.ResponseWriter,
    r *http.Request,
) {
    if r.Method != http.MethodGet {
        http.NotFound(w, r)
        return
    }

    userID, ok := h.authenticate(r)
    if !ok {
        writeJSON(w, http.StatusUnauthorized, map[string]string{
            "error": "unauthorized",
        })
        return
    }

    notifications, err := h.svc.List(
        r.Context(),
        userID,
    )
    if err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{
            "error": err.Error(),
        })
        return
    }

    writeJSON(w, http.StatusOK, map[string]any{
        "notifications": notifications,
    })
}

func (h *Handler) notificationByID(
    w http.ResponseWriter,
    r *http.Request,
) {
    path := strings.TrimPrefix(
        r.URL.Path,
        "/api/notifications/",
    )
    path = strings.TrimSuffix(path, "/")

    if path == "" {
        http.NotFound(w, r)
        return
    }

    parts := strings.Split(path, "/")

    userID, ok := h.authenticate(r)
    if !ok {
        writeJSON(w, http.StatusUnauthorized, map[string]string{
            "error": "unauthorized",
        })
        return
    }

    if len(parts) == 2 && parts[1] == "read" {
        if r.Method != http.MethodPatch {
            http.NotFound(w, r)
            return
        }

        if err := h.svc.MarkRead(
            r.Context(),
            userID,
            parts[0],
        ); err != nil {
            h.writeServiceError(w, err)
            return
        }

        writeJSON(w, http.StatusOK, map[string]string{
            "status": "read",
        })
        return
    }

    if len(parts) == 1 && r.Method == http.MethodGet {
        notification, err := h.svc.Get(
            r.Context(),
            userID,
            parts[0],
        )
        if err != nil {
            h.writeServiceError(w, err)
            return
        }

        writeJSON(w, http.StatusOK, notification)
        return
    }

    http.NotFound(w, r)
}

func (h *Handler) authenticate(
    r *http.Request,
) (string, bool) {
    header := r.Header.Get("Authorization")

    if !strings.HasPrefix(header, "Bearer ") {
        return "", false
    }

    tokenString := strings.TrimSpace(
        strings.TrimPrefix(header, "Bearer "),
    )

    token, err := jwt.Parse(
        tokenString,
        func(token *jwt.Token) (any, error) {
            if token.Method != jwt.SigningMethodHS256 {
                return nil, errors.New(
                    "unexpected signing method",
                )
            }

            return []byte(h.jwtSecret), nil
        },
    )

    if err != nil || !token.Valid {
        return "", false
    }

    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok {
        return "", false
    }

    for _, key := range []string{
        "sub",
        "user_id",
        "userId",
    } {
        if value, ok := claims[key].(string); ok &&
            value != "" {
            return value, true
        }
    }

    return "", false
}

func (h *Handler) writeServiceError(
    w http.ResponseWriter,
    err error,
) {
    switch {
    case errors.Is(err, repository.ErrNotFound):
        writeJSON(w, http.StatusNotFound, map[string]string{
            "error": "notification not found",
        })

    case errors.Is(err, service.ErrUnauthorized):
        writeJSON(w, http.StatusForbidden, map[string]string{
            "error": "forbidden",
        })

    default:
        writeJSON(w, http.StatusInternalServerError, map[string]string{
            "error": err.Error(),
        })
    }
}

func writeJSON(
    w http.ResponseWriter,
    status int,
    value any,
) {
    w.Header().Set(
        "Content-Type",
        "application/json",
    )

    w.WriteHeader(status)

    _ = json.NewEncoder(w).Encode(value)
}
