package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/kathputli/artist-service/internal/model"
	"github.com/kathputli/artist-service/internal/service"
)

type Handler struct {
	service   *service.ArtistService
	jwtSecret string
}

type claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

type contextKey string

const userContextKey contextKey = "user"

type authUser struct {
	ID   uuid.UUID
	Role string
}

func New(svc *service.ArtistService, jwtSecret string) *Handler {
	return &Handler{
		service:   svc,
		jwtSecret: jwtSecret,
	}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", h.healthz)
	mux.HandleFunc("GET /readyz", h.readyz)

	mux.HandleFunc("POST /api/artists", h.requireRole("artist-admin", h.create))
	mux.HandleFunc("GET /api/artists/{id}", h.get)
	mux.HandleFunc("PUT /api/artists/{id}", h.requireRole("artist-admin", h.update))

	return mux
}

func (h *Handler) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"service": "artist-service",
		"status":  "ok",
	})
}

func (h *Handler) readyz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ready",
	})
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req model.CreateArtistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	artist, err := h.service.Create(r.Context(), user.ID, req)
	if err != nil {
		log.Printf("create artist failed: %v", err)
		h.handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, artist)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid artist id")
		return
	}

	artist, err := h.service.Get(r.Context(), id)
	if err != nil {
		log.Printf("get artist failed: %v", err)
		h.handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, artist)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	artistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid artist id")
		return
	}

	var req model.UpdateArtistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	artist, err := h.service.Update(r.Context(), user.ID, artistID, req)
	if err != nil {
		log.Printf("update artist failed: %v", err)
		h.handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, artist)
}

func (h *Handler) requireRole(role string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := h.authenticate(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, err.Error())
			return
		}

		if user.Role != role {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}

		ctx := context.WithValue(r.Context(), userContextKey, user)
		next(w, r.WithContext(ctx))
	}
}

func (h *Handler) authenticate(r *http.Request) (*authUser, error) {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return nil, errors.New("missing bearer token")
	}

	tokenString := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if tokenString == "" {
		return nil, errors.New("missing bearer token")
	}

	token, err := jwt.ParseWithClaims(
		tokenString,
		&claims{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(h.jwtSecret), nil
		},
	)
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}

	c, ok := token.Claims.(*claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	userID, err := uuid.Parse(c.Subject)
	if err != nil {
		return nil, errors.New("invalid user id in token")
	}

	return &authUser{
		ID:   userID,
		Role: c.Role,
	}, nil
}

func userFromContext(ctx context.Context) (*authUser, bool) {
	user, ok := ctx.Value(userContextKey).(*authUser)
	return user, ok
}

func (h *Handler) handleServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidInput):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, service.ErrArtistNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, service.ErrForbidden):
		writeError(w, http.StatusForbidden, err.Error())
	case strings.Contains(err.Error(), "artist profile already exists"):
		writeError(w, http.StatusConflict, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}

func writeJSON(w http.ResponseWriter, status int, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{
		"error": message,
	})
}
