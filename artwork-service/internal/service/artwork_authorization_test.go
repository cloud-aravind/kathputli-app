package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"

	"github.com/kathputli/artwork-service/internal/client"
)

func TestListArtworksRejectsOtherArtist(t *testing.T) {
	artistID := uuid.New()
	requesterID := uuid.New()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/internal/v1/artist-ownership/verify" {
			t.Errorf("artist ownership request = %s %q", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("ARTIST_INTERNAL_API_TOKEN"); got != "internal-test-token" {
			t.Errorf("internal token header = %q", got)
		}
		var body struct {
			ArtistID uuid.UUID `json:"artist_id"`
			UserID   uuid.UUID `json:"user_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Errorf("decode ownership request: %v", err)
		} else if body.ArtistID != artistID || body.UserID != requesterID {
			t.Errorf("ownership identifiers = (%s, %s), want (%s, %s)", body.ArtistID, body.UserID, artistID, requesterID)
		}
		w.WriteHeader(http.StatusForbidden)
	}))
	defer server.Close()

	svc := NewArtworkService(nil, nil, client.NewArtistClient(server.URL, "internal-test-token"))
	_, err := svc.ListArtworks(context.Background(), requesterID, artistID)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("ListArtworks error = %v, want %v", err, ErrForbidden)
	}
}
