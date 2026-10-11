package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"

	"github.com/kathputli/payment-service/internal/model"
	"github.com/kathputli/payment-service/internal/repository"
	"github.com/kathputli/payment-service/internal/service"
)

type Handler struct {
	svc       *service.Service
	jwtSecret string
}

func New(
	svc *service.Service,
	jwtSecret string,
) *Handler {
	return &Handler{
		svc:       svc,
		jwtSecret: jwtSecret,
	}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", h.healthz)
	mux.HandleFunc("/readyz", h.readyz)

	mux.HandleFunc("/api/payments", h.payments)
	mux.HandleFunc("/api/payments/", h.paymentByID)
	mux.HandleFunc("/api/orders/", h.orderPayment)

	return mux
}

func (h *Handler) healthz(
	w http.ResponseWriter,
	_ *http.Request,
) {
	writeJSON(
		w,
		http.StatusOK,
		map[string]string{
			"status": "ok",
		},
	)
}

func (h *Handler) readyz(
	w http.ResponseWriter,
	_ *http.Request,
) {
	writeJSON(
		w,
		http.StatusOK,
		map[string]string{
			"status": "ready",
		},
	)
}

func (h *Handler) payments(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.NotFound(w, r)
		return
	}

	customerID, ok := h.authenticate(r)
	if !ok {
		writeJSON(
			w,
			http.StatusUnauthorized,
			map[string]string{
				"error": "unauthorized",
			},
		)
		return
	}

	var req model.CreatePaymentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(
			w,
			http.StatusBadRequest,
			map[string]string{
				"error": "invalid request body",
			},
		)
		return
	}

	payment, err := h.svc.CreatePayment(
		r.Context(),
		customerID,
		req,
	)

	if err != nil {
		status := http.StatusInternalServerError

		if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		} else if errors.Is(err, service.ErrAlreadyPaid) {
			status = http.StatusConflict
		} else if strings.Contains(
			err.Error(),
			"invalid order_id",
		) ||
			strings.Contains(
				err.Error(),
				"not been initialized",
			) {
			status = http.StatusBadRequest
		}

		writeJSON(
			w,
			status,
			map[string]string{
				"error": err.Error(),
			},
		)
		return
	}

	writeJSON(
		w,
		http.StatusCreated,
		payment,
	)
}

// paymentByID supports:
//
// GET  /api/payments/{id}
// POST /api/payments/{id}/complete
func (h *Handler) paymentByID(
	w http.ResponseWriter,
	r *http.Request,
) {
	path := strings.TrimPrefix(
		r.URL.Path,
		"/api/payments/",
	)

	path = strings.TrimSuffix(
		path,
		"/",
	)

	if path == "" {
		http.NotFound(w, r)
		return
	}

	parts := strings.Split(
		path,
		"/",
	)

	customerID, ok := h.authenticate(r)
	if !ok {
		writeJSON(
			w,
			http.StatusUnauthorized,
			map[string]string{
				"error": "unauthorized",
			},
		)
		return
	}

	// POST /api/payments/{id}/complete
	if len(parts) == 2 &&
		parts[1] == "complete" {

		if r.Method != http.MethodPost {
			http.NotFound(w, r)
			return
		}

		payment, err := h.svc.CompleteMockPayment(
			r.Context(),
			customerID,
			parts[0],
		)

		if err != nil {
			h.writeServiceError(w, err)
			return
		}

		writeJSON(
			w,
			http.StatusOK,
			payment,
		)
		return
	}

	// GET /api/payments/{id}
	if len(parts) == 1 {

		if r.Method != http.MethodGet {
			http.NotFound(w, r)
			return
		}

		payment, err := h.svc.GetPayment(
			r.Context(),
			customerID,
			parts[0],
		)

		if err != nil {
			h.writeServiceError(w, err)
			return
		}

		writeJSON(
			w,
			http.StatusOK,
			payment,
		)
		return
	}

	http.NotFound(w, r)
}

func (h *Handler) orderPayment(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodGet {
		http.NotFound(w, r)
		return
	}

	customerID, ok := h.authenticate(r)
	if !ok {
		writeJSON(
			w,
			http.StatusUnauthorized,
			map[string]string{
				"error": "unauthorized",
			},
		)
		return
	}

	const prefix = "/api/orders/"

	path := strings.TrimPrefix(
		r.URL.Path,
		prefix,
	)

	if !strings.HasSuffix(
		path,
		"/payment",
	) {
		http.NotFound(w, r)
		return
	}

	orderID := strings.TrimSuffix(
		path,
		"/payment",
	)

	orderID = strings.TrimSuffix(
		orderID,
		"/",
	)

	if orderID == "" {
		http.NotFound(w, r)
		return
	}

	payment, err := h.svc.GetPaymentByOrder(
		r.Context(),
		customerID,
		orderID,
	)

	if err != nil {
		h.writeServiceError(w, err)
		return
	}

	writeJSON(
		w,
		http.StatusOK,
		payment,
	)
}

func (h *Handler) authenticate(
	r *http.Request,
) (string, bool) {

	header := r.Header.Get("Authorization")

	if !strings.HasPrefix(
		header,
		"Bearer ",
	) {
		return "", false
	}

	tokenString := strings.TrimSpace(
		strings.TrimPrefix(
			header,
			"Bearer ",
		),
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
	case errors.Is(
		err,
		repository.ErrNotFound,
	):
		writeJSON(
			w,
			http.StatusNotFound,
			map[string]string{
				"error": "payment not found",
			},
		)

	case errors.Is(
		err,
		service.ErrUnauthorized,
	):
		writeJSON(
			w,
			http.StatusForbidden,
			map[string]string{
				"error": "forbidden",
			},
		)

	default:
		writeJSON(
			w,
			http.StatusInternalServerError,
			map[string]string{
				"error": err.Error(),
			},
		)
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
