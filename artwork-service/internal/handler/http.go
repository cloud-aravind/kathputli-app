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

	"github.com/kathputli/artwork-service/internal/model"
	"github.com/kathputli/artwork-service/internal/service"
)

type Handler struct {
	service   *service.ArtworkService
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

func New(svc *service.ArtworkService, jwtSecret string) *Handler {
	return &Handler{service: svc, jwtSecret: jwtSecret}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.healthz)
	mux.HandleFunc("GET /readyz", h.readyz)
	mux.HandleFunc("POST /api/artists/{artistID}/categories", h.requireRole("artist-admin", h.createCategory))
	mux.HandleFunc("GET /api/artists/{artistID}/categories", h.listCategories)
	mux.HandleFunc("POST /api/artists/{artistID}/artworks", h.requireRole("artist-admin", h.createArtwork))
	mux.HandleFunc("GET /api/artists/{artistID}/artworks", h.listArtworks)
	mux.HandleFunc("GET /api/artworks", h.listAllArtworks)
	mux.HandleFunc("GET /api/artworks/{id}", h.getArtwork)
	mux.HandleFunc("PUT /api/artworks/{id}", h.requireRole("artist-admin", h.updateArtwork))
	mux.HandleFunc("DELETE /api/artworks/{id}", h.requireRole("artist-admin", h.deleteArtwork))
	return mux
}

func (h *Handler) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"service": "artwork-service", "status": "ok"})
}
func (h *Handler) readyz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (h *Handler) createCategory(w http.ResponseWriter, r *http.Request) {
	u, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	artistID, err := parseUUID(r.PathValue("artistID"), "artist id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	var req model.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, 400, "invalid JSON")
		return
	}
	c, err := h.service.CreateCategory(r.Context(), u.ID, artistID, req)
	if err != nil {
		log.Printf("create category failed: %v", err)
		h.handleError(w, err)
		return
	}
	writeJSON(w, 201, c)
}

func (h *Handler) listCategories(w http.ResponseWriter, r *http.Request) {
	artistID, err := parseUUID(r.PathValue("artistID"), "artist id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	c, err := h.service.ListCategories(r.Context(), artistID)
	if err != nil {
		log.Printf("list categories failed: %v", err)
		h.handleError(w, err)
		return
	}
	writeJSON(w, 200, c)
}

func (h *Handler) createArtwork(w http.ResponseWriter, r *http.Request) {
	u, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	artistID, err := parseUUID(r.PathValue("artistID"), "artist id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	var req model.CreateArtworkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, 400, "invalid JSON")
		return
	}
	a, err := h.service.CreateArtwork(r.Context(), u.ID, artistID, req)
	if err != nil {
		log.Printf("create artwork failed: %v", err)
		h.handleError(w, err)
		return
	}
	writeJSON(w, 201, a)
}

func (h *Handler) listArtworks(w http.ResponseWriter, r *http.Request) {
	artistID, err := parseUUID(r.PathValue("artistID"), "artist id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	a, err := h.service.ListArtworks(r.Context(), artistID)
	if err != nil {
		log.Printf("list artworks failed: %v", err)
		h.handleError(w, err)
		return
	}
	writeJSON(w, 200, a)
}

func (h *Handler) listAllArtworks(w http.ResponseWriter, r *http.Request) {
	a, err := h.service.ListActiveArtworks(r.Context())
	if err != nil {
		log.Printf("list all artworks failed: %v", err)
		h.handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *Handler) getArtwork(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"), "artwork id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	a, err := h.service.GetArtwork(r.Context(), id)
	if err != nil {
		log.Printf("get artwork failed: %v", err)
		h.handleError(w, err)
		return
	}
	writeJSON(w, 200, a)
}

func (h *Handler) updateArtwork(w http.ResponseWriter, r *http.Request) {
	u, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	id, err := parseUUID(r.PathValue("id"), "artwork id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	var req model.UpdateArtworkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, 400, "invalid JSON")
		return
	}
	a, err := h.service.UpdateArtwork(r.Context(), u.ID, id, req)
	if err != nil {
		log.Printf("update artwork failed: %v", err)
		h.handleError(w, err)
		return
	}
	writeJSON(w, 200, a)
}

func (h *Handler) deleteArtwork(w http.ResponseWriter, r *http.Request) {
	u, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	id, err := parseUUID(r.PathValue("id"), "artwork id")
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if err := h.service.DeleteArtwork(r.Context(), u.ID, id); err != nil {
		log.Printf("delete artwork failed: %v", err)
		h.handleError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) requireRole(role string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := h.authenticate(r)
		if err != nil {
			writeError(w, 401, err.Error())
			return
		}
		if u.Role != role {
			writeError(w, 403, "forbidden")
			return
		}
		ctx := context.WithValue(r.Context(), userContextKey, u)
		next(w, r.WithContext(ctx))
	}
}

func (h *Handler) authenticate(r *http.Request) (*authUser, error) {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return nil, errors.New("missing bearer token")
	}
	raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if raw == "" {
		return nil, errors.New("missing bearer token")
	}
	token, err := jwt.ParseWithClaims(raw, &claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}
	c, ok := token.Claims.(*claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}
	id, err := uuid.Parse(c.Subject)
	if err != nil {
		return nil, errors.New("invalid user id in token")
	}
	return &authUser{ID: id, Role: c.Role}, nil
}

func userFromContext(ctx context.Context) (*authUser, bool) {
	u, ok := ctx.Value(userContextKey).(*authUser)
	return u, ok
}

func parseUUID(v, label string) (uuid.UUID, error) {
	id, err := uuid.Parse(v)
	if err != nil {
		return uuid.Nil, errors.New("invalid " + label)
	}
	return id, nil
}

func (h *Handler) handleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidInput):
		writeError(w, 400, err.Error())
	case errors.Is(err, service.ErrCategoryNotFound):
		writeError(w, 404, err.Error())
	case errors.Is(err, service.ErrArtworkNotFound):
		writeError(w, 404, err.Error())
	case errors.Is(err, service.ErrForbidden):
		writeError(w, 403, err.Error())
	case errors.Is(err, service.ErrAlreadyExists):
		writeError(w, 409, err.Error())
	case errors.Is(err, service.ErrArtistNotFound):
		writeError(w, 404, err.Error())
	default:
		writeError(w, 500, "internal server error")
	}
}

func writeJSON(w http.ResponseWriter, status int, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
