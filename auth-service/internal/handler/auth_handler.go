package handler

import (
	"encoding/json"
	"errors"
	"github.com/kathputli/auth-service/internal/middleware"
	"github.com/kathputli/auth-service/internal/model"
	"github.com/kathputli/auth-service/internal/repository"
	"github.com/kathputli/auth-service/internal/service"
	"net/http"
	"strings"
)

type AuthHandler struct {
	authService *service.AuthService
	users       *repository.UserRepository
}

func NewAuthHandler(a *service.AuthService, u *repository.UserRepository) *AuthHandler {
	return &AuthHandler{a, u}
}
func (h *AuthHandler) Routes() http.Handler {
	m := http.NewServeMux()
	m.HandleFunc("GET /healthz", h.health)
	m.HandleFunc("GET /readyz", h.ready)
	m.HandleFunc("POST /api/auth/register", h.register)
	m.HandleFunc("POST /api/auth/login", h.login)
	m.Handle("GET /api/auth/me", middleware.RequireAuth(h.authService, http.HandlerFunc(h.me)))
	return m
}
func (h *AuthHandler) register(w http.ResponseWriter, r *http.Request) {
	var q model.RegisterRequest
	if e := decodeJSON(r, &q); e != nil {
		writeError(w, 400, "invalid request body")
		return
	}
	u, e := h.authService.Register(r.Context(), q)
	if e != nil {
		switch {
		case errors.Is(e, service.ErrInvalidInput), errors.Is(e, service.ErrInvalidRole):
			writeError(w, 400, e.Error())
		case errors.Is(e, repository.ErrEmailExists):
			writeError(w, 409, e.Error())
		default:
			writeError(w, 500, "internal server error")
		}
		return
	}
	writeJSON(w, 201, u)
}
func (h *AuthHandler) login(w http.ResponseWriter, r *http.Request) {
	var q model.LoginRequest
	if e := decodeJSON(r, &q); e != nil {
		writeError(w, 400, "invalid request body")
		return
	}
	v, e := h.authService.Login(r.Context(), q)
	if e != nil {
		if errors.Is(e, service.ErrInvalidCredentials) {
			writeError(w, 401, e.Error())
			return
		}
		writeError(w, 500, "internal server error")
		return
	}
	writeJSON(w, 200, v)
}
func (h *AuthHandler) me(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	u, e := h.authService.UserByID(r.Context(), id)
	if e != nil {
		if errors.Is(e, repository.ErrUserNotFound) {
			writeError(w, 401, "user not found")
			return
		}
		writeError(w, 500, "internal server error")
		return
	}
	writeJSON(w, 200, u)
}
func (h *AuthHandler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, 200, map[string]string{"status": "ok", "service": "auth-service"})
}
func (h *AuthHandler) ready(w http.ResponseWriter, r *http.Request) {
	if e := h.users.Ready(r.Context()); e != nil {
		writeError(w, 503, "database unavailable")
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ready"})
}
func decodeJSON(r *http.Request, v interface{}) error {
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		return errors.New("content type must be application/json")
	}
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	return d.Decode(v)
}
func writeJSON(w http.ResponseWriter, s int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	_ = json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, s int, m string) {
	writeJSON(w, s, map[string]string{"error": m})
}
