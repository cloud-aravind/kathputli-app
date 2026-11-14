package handler

import (
	"context"
	"crypto/subtle"
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
	service          artistService
	jwtSecret        string
	internalAPIToken string
}

type artistService interface {
	ListPublic(context.Context) ([]model.PublicArtist, error)
	Create(context.Context, uuid.UUID, model.CreateArtistRequest) (*model.Artist, error)
	GetPublic(context.Context, uuid.UUID) (*model.PublicArtist, error)
	GetByUserID(context.Context, uuid.UUID) (*model.Artist, error)
	Update(context.Context, uuid.UUID, uuid.UUID, model.UpdateArtistRequest) (*model.Artist, error)
	VerifyOwnership(context.Context, uuid.UUID, uuid.UUID) error
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

func New(svc artistService, jwtSecret, internalAPIToken string) *Handler {
	return &Handler{
		service:          svc,
		jwtSecret:        jwtSecret,
		internalAPIToken: internalAPIToken,
	}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", h.healthz)
	mux.HandleFunc("GET /readyz", h.readyz)

	mux.HandleFunc("GET /api/artists", h.listPublic)
	mux.HandleFunc("POST /internal/v1/artist-ownership/verify", h.verifyArtistOwnership)
	mux.HandleFunc("POST /api/artists", h.requireRole("artist-admin", h.create))
	mux.Handle("GET /api/artists/me", h.requireRole("artist-admin", http.HandlerFunc(h.getCurrent)))
	mux.HandleFunc("GET /api/artists/{id}", h.get)
	mux.HandleFunc("PUT /api/artists/{id}", h.requireRole("artist-admin", h.update))

	return mux
}

func (h *Handler) listPublic(w http.ResponseWriter, r *http.Request) {
	artists, err := h.service.ListPublic(r.Context())
	if err != nil {
		log.Printf("list public artists failed: %v", err)
		writeError(w, http.StatusInternalServerError, "could not list artists")
		return
	}
	writeJSON(w, http.StatusOK, artists)
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

	artist, err := h.service.GetPublic(r.Context(), id)
	if err != nil {
		log.Printf("get artist failed: %v", err)
		h.handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, artist)
}

type ownershipVerificationRequest struct {
	ArtistID uuid.UUID `json:"artist_id"`
	UserID   uuid.UUID `json:"user_id"`
}

func (h *Handler) verifyArtistOwnership(w http.ResponseWriter, r *http.Request) {
	providedToken := r.Header.Get("ARTIST_INTERNAL_API_TOKEN")
	if h.internalAPIToken == "" || subtle.ConstantTimeCompare([]byte(providedToken), []byte(h.internalAPIToken)) != 1 {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req ownershipVerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.ArtistID == uuid.Nil || req.UserID == uuid.Nil {
		writeError(w, http.StatusBadRequest, "invalid ownership identifiers")
		return
	}

	if err := h.service.VerifyOwnership(r.Context(), req.UserID, req.ArtistID); err != nil {
		if errors.Is(err, service.ErrForbidden) || errors.Is(err, service.ErrArtistNotFound) {
			writeError(w, http.StatusForbidden, "ownership verification failed")
			return
		}
		if errors.Is(err, service.ErrInvalidInput) {
			writeError(w, http.StatusBadRequest, "invalid ownership identifiers")
			return
		}
		log.Printf("artist ownership verification failed: %v", err)
		writeError(w, http.StatusInternalServerError, "ownership verification failed")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) getCurrent(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	artist, err := h.service.GetByUserID(r.Context(), user.ID)
	if err != nil {
		log.Printf("get current artist failed: %v", err)
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
