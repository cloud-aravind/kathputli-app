package handler

import (
	"encoding/json"
	"errors"
	"github.com/google/uuid"
	"github.com/kathputli/user-service/internal/middleware"
	"github.com/kathputli/user-service/internal/model"
	"github.com/kathputli/user-service/internal/repository"
	"github.com/kathputli/user-service/internal/service"
	"net/http"
	"strings"
)

type UserHandler struct {
	svc       *service.UserService
	repo      *repository.UserRepository
	jwtSecret string
}

func NewUserHandler(s *service.UserService, r *repository.UserRepository, secret string) *UserHandler {
	return &UserHandler{s, r, secret}
}

func (h *UserHandler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.health)
	mux.HandleFunc("GET /readyz", h.ready)
	mux.Handle("GET /api/users/me", middleware.RequireAuth(h.jwtSecret, http.HandlerFunc(h.getMe)))
	mux.Handle("PUT /api/users/me", middleware.RequireAuth(h.jwtSecret, http.HandlerFunc(h.updateMe)))
	mux.Handle("GET /api/users/{id}", middleware.RequireAuth(h.jwtSecret, http.HandlerFunc(h.getByID)))
	return mux
}
func (h *UserHandler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, 200, map[string]string{"status": "ok", "service": "user-service"})
}
func (h *UserHandler) ready(w http.ResponseWriter, r *http.Request) {
	if e := h.repo.Ready(r.Context()); e != nil {
		writeError(w, 503, "database unavailable")
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ready"})
}
func (h *UserHandler) getMe(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	h.getUser(w, r, id)
}
func (h *UserHandler) getByID(w http.ResponseWriter, r *http.Request) {
	id, e := uuid.Parse(r.PathValue("id"))
	if e != nil {
		writeError(w, 400, "invalid user id")
		return
	}
	h.getUser(w, r, id)
}
func (h *UserHandler) getUser(w http.ResponseWriter, r *http.Request, id uuid.UUID) {
	u, e := h.svc.GetByID(r.Context(), id)
	if e != nil {
		if errors.Is(e, repository.ErrUserNotFound) {
			writeError(w, 404, "user not found")
			return
		}
		writeError(w, 500, "internal server error")
		return
	}
	writeJSON(w, 200, u)
}
func (h *UserHandler) updateMe(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	var req model.UpdateProfileRequest
	if e := decodeJSON(r, &req); e != nil {
		writeError(w, 400, "invalid request body")
		return
	}
	u, e := h.svc.UpdateProfile(r.Context(), id, req)
	if e != nil {
		if errors.Is(e, service.ErrInvalidName) {
			writeError(w, 400, e.Error())
			return
		}
		if errors.Is(e, repository.ErrUserNotFound) {
			writeError(w, 404, "user not found")
			return
		}
		writeError(w, 500, "internal server error")
		return
	}
	writeJSON(w, 200, u)
}
func decodeJSON(r *http.Request, v interface{}) error {
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		return errors.New("content type must be application/json")
	}
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	return d.Decode(v)
}
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
