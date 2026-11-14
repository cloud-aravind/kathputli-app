package client

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
)

func TestVerifyOwnershipUsesInternalEndpointContract(t *testing.T) {
	artistID, userID := uuid.New(), uuid.New()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("method = %q, want POST", r.Method)
		}
		if r.URL.Path != "/internal/v1/artist-ownership/verify" {
			t.Errorf("path = %q, want internal ownership endpoint", r.URL.Path)
		}
		if got := r.Header.Get("ARTIST_INTERNAL_API_TOKEN"); got != "test-internal-token" {
			t.Errorf("internal token header = %q", got)
		}
		if got := r.Header.Get("Content-Type"); got != "application/json" {
			t.Errorf("Content-Type = %q, want application/json", got)
		}
		var body ownershipVerificationRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Errorf("decode body: %v", err)
		} else if body.ArtistID != artistID || body.UserID != userID {
			t.Errorf("body IDs = (%s, %s), want (%s, %s)", body.ArtistID, body.UserID, artistID, userID)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	api := NewArtistClient(server.URL+"/", "test-internal-token")
	if err := api.VerifyOwnership(context.Background(), userID, artistID); err != nil {
		t.Fatalf("VerifyOwnership error = %v, want nil", err)
	}
}

func TestVerifyOwnershipRejectsUnauthorizedForbiddenAndUnexpectedResponses(t *testing.T) {
	for _, tc := range []struct {
		name       string
		status     int
		wantErr    error
		wantNonNil bool
	}{
		{name: "unauthorized", status: http.StatusUnauthorized, wantNonNil: true},
		{name: "forbidden", status: http.StatusForbidden, wantErr: ErrForbidden, wantNonNil: true},
		{name: "unexpected success response", status: http.StatusOK, wantNonNil: true},
		{name: "unexpected server response", status: http.StatusInternalServerError, wantNonNil: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(tc.status)
			}))
			defer server.Close()

			err := NewArtistClient(server.URL, "test-internal-token").VerifyOwnership(
				context.Background(), uuid.New(), uuid.New(),
			)
			if (err != nil) != tc.wantNonNil {
				t.Fatalf("VerifyOwnership error = %v, want error=%t", err, tc.wantNonNil)
			}
			if tc.wantErr != nil && !errors.Is(err, tc.wantErr) {
				t.Fatalf("VerifyOwnership error = %v, want %v", err, tc.wantErr)
			}
		})
	}
}

func TestVerifyOwnershipFailsSafelyWithoutConfiguredToken(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	defer server.Close()

	err := NewArtistClient(server.URL, "").VerifyOwnership(context.Background(), uuid.New(), uuid.New())
	if err == nil {
		t.Fatal("VerifyOwnership error = nil, want missing-token error")
	}
	if called {
		t.Fatal("Artist Service was called without a configured internal token")
	}
}
