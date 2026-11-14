package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestArtistArtworkListRequiresArtistAdminAuthentication(t *testing.T) {
	const secret = "test-secret"
	h := New(nil, secret)
	artistID := uuid.New()

	t.Run("missing token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/artists/"+artistID.String()+"/artworks", nil)
		res := httptest.NewRecorder()
		h.Routes().ServeHTTP(res, req)
		if res.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
		}
	})

	t.Run("wrong role", func(t *testing.T) {
		claims := claims{Role: "customer", RegisteredClaims: jwt.RegisteredClaims{
			Subject:   uuid.NewString(),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
		}}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		encoded, err := token.SignedString([]byte(secret))
		if err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequest(http.MethodGet, "/api/artists/"+artistID.String()+"/artworks", nil)
		req.Header.Set("Authorization", "Bearer "+encoded)
		res := httptest.NewRecorder()
		h.Routes().ServeHTTP(res, req)
		if res.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want %d", res.Code, http.StatusForbidden)
		}
	})
}
