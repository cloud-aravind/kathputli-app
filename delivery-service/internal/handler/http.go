package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/kathputli/delivery-service/internal/middleware"
	"github.com/kathputli/delivery-service/internal/model"
	"github.com/kathputli/delivery-service/internal/service"
)

type Handler struct {
	service   *service.Service
	jwtSecret string
}

func New(service *service.Service, jwtSecret string) *Handler {
	return &Handler{service: service, jwtSecret: jwtSecret}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", h.health)
	mux.HandleFunc("/readyz", h.ready)

	mux.Handle(
		"/api/deliveries/order/",
		middleware.JWTAuth(h.jwtSecret, http.HandlerFunc(h.getByOrder)),
	)

	mux.Handle(
		"/api/deliveries/",
		middleware.JWTAuth(h.jwtSecret, http.HandlerFunc(h.deliveryRoutes)),
	)

	return mux
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) ready(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (h *Handler) getByOrder(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimPrefix(r.URL.Path, "/api/deliveries/order/")
	if orderID == "" {
		writeError(w, http.StatusBadRequest, "order id is required")
		return
	}

	delivery, err := h.service.GetByOrderID(r.Context(), orderID)
	if err != nil {
		writeError(w, http.StatusNotFound, "delivery not found")
		return
	}

	writeJSON(w, http.StatusOK, delivery)
}

func (h *Handler) deliveryRoutes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	role := r.Header.Get("X-User-Role")
	if role != "delivery-agent" {
		writeError(w, http.StatusForbidden, "insufficient role")
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/deliveries/")
	if id == "" {
		writeError(w, http.StatusBadRequest, "delivery id is required")
		return
	}

	var request model.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "user identity missing")
		return
	}

	delivery, err := h.service.UpdateStatus(r.Context(), id, request.Status, userID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidStatus), errors.Is(err, service.ErrInvalidTransition):
			writeError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrNotAssigned):
			writeError(w, http.StatusForbidden, err.Error())
		default:
			writeError(w, http.StatusNotFound, "delivery not found")
		}
		return
	}

	writeJSON(w, http.StatusOK, delivery)
}

func writeJSON(w http.ResponseWriter, status int, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
