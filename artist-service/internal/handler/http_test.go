package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/kathputli/artist-service/internal/model"
	"github.com/kathputli/artist-service/internal/service"
)

type artistServiceStub struct {
	artist           *model.Artist
	userID           uuid.UUID
	public           []model.PublicArtist
	publicArtist     *model.PublicArtist
	publicArtistID   uuid.UUID
	verifiedUserID   uuid.UUID
	verifiedArtistID uuid.UUID
	verifyErr        error
}

func (s *artistServiceStub) ListPublic(context.Context) ([]model.PublicArtist, error) {
	return s.public, nil
}

func (s *artistServiceStub) Create(context.Context, uuid.UUID, model.CreateArtistRequest) (*model.Artist, error) {
	return nil, nil
}

func (s *artistServiceStub) GetPublic(_ context.Context, artistID uuid.UUID) (*model.PublicArtist, error) {
	s.publicArtistID = artistID
	return s.publicArtist, nil
}

func (s *artistServiceStub) GetByUserID(_ context.Context, userID uuid.UUID) (*model.Artist, error) {
	s.userID = userID
	return s.artist, nil
}

func (s *artistServiceStub) Update(context.Context, uuid.UUID, uuid.UUID, model.UpdateArtistRequest) (*model.Artist, error) {
	return nil, nil
}

func (s *artistServiceStub) VerifyOwnership(_ context.Context, userID, artistID uuid.UUID) error {
	s.verifiedUserID = userID
	s.verifiedArtistID = artistID
	return s.verifyErr
}

func TestGetCurrentResolvesProfileFromAuthenticatedUser(t *testing.T) {
	const secret = "test-secret"
	userID := uuid.New()
	artistID := uuid.New()
	stub := &artistServiceStub{artist: &model.Artist{ID: artistID, UserID: userID}}
	handler := New(stub, secret, "internal-test-token").Routes()

	claims := claims{Role: "artist-admin", RegisteredClaims: jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
	}}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	encoded, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/artists/me", nil)
	req.Header.Set("Authorization", "Bearer "+encoded)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", res.Code, http.StatusOK, res.Body.String())
	}
	if stub.userID != userID {
		t.Fatalf("lookup user ID = %s, want authenticated user %s", stub.userID, userID)
	}
	var artist model.Artist
	if err := json.NewDecoder(res.Body).Decode(&artist); err != nil {
		t.Fatal(err)
	}
	if artist.ID != artistID || artist.UserID != userID {
		t.Fatalf("returned artist identity = (%s, %s), want (%s, %s)", artist.ID, artist.UserID, artistID, userID)
	}
}

func TestListPublicReturnsOnlyPublicProfileFieldsWithoutAuthentication(t *testing.T) {
	artistID := uuid.New()
	stub := &artistServiceStub{public: []model.PublicArtist{{
		ID: artistID, Name: "Artist Example", City: "Jaipur", State: "Rajasthan", Country: "India", Bio: "Traditional painter",
	}}}
	handler := New(stub, "test-secret", "internal-test-token").Routes()
	req := httptest.NewRequest(http.MethodGet, "/api/artists", nil)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", res.Code, http.StatusOK, res.Body.String())
	}
	var artists []map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&artists); err != nil {
		t.Fatal(err)
	}
	if len(artists) != 1 || artists[0]["id"] != artistID.String() {
		t.Fatalf("unexpected public artist response: %#v", artists)
	}
	for _, internalField := range []string{"user_id", "email", "phone", "address"} {
		if _, exposed := artists[0][internalField]; exposed {
			t.Errorf("public response unexpectedly contains %q", internalField)
		}
	}
}

func TestGetByIDReturnsOnlyPublicProfileFieldsWithoutAuthentication(t *testing.T) {
	artistID := uuid.New()
	stub := &artistServiceStub{publicArtist: &model.PublicArtist{
		ID: artistID, Name: "Artist Example", City: "Jaipur", State: "Rajasthan", Country: "India", Bio: "Traditional painter",
	}}
	handler := New(stub, "test-secret", "internal-test-token").Routes()
	req := httptest.NewRequest(http.MethodGet, "/api/artists/"+artistID.String(), nil)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", res.Code, http.StatusOK, res.Body.String())
	}
	if stub.publicArtistID != artistID {
		t.Fatalf("lookup artist ID = %s, want %s", stub.publicArtistID, artistID)
	}
	var artist map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&artist); err != nil {
		t.Fatal(err)
	}
	if artist["id"] != artistID.String() || artist["name"] != "Artist Example" {
		t.Fatalf("unexpected public artist response: %#v", artist)
	}
	for _, privateField := range []string{"user_id", "email", "phone", "address"} {
		if _, exposed := artist[privateField]; exposed {
			t.Errorf("public response unexpectedly contains %q", privateField)
		}
	}
}

func TestVerifyArtistOwnershipRejectsMissingAndInvalidInternalTokens(t *testing.T) {
	artistID, userID := uuid.New(), uuid.New()
	body, err := json.Marshal(map[string]string{"artist_id": artistID.String(), "user_id": userID.String()})
	if err != nil {
		t.Fatal(err)
	}

	for _, token := range []string{"", "wrong-token"} {
		t.Run(map[bool]string{true: "missing", false: "invalid"}[token == ""], func(t *testing.T) {
			handler := New(&artistServiceStub{}, "jwt-secret", "internal-test-token").Routes()
			req := httptest.NewRequest(http.MethodPost, "/internal/v1/artist-ownership/verify", bytes.NewReader(body))
			if token != "" {
				req.Header.Set("ARTIST_INTERNAL_API_TOKEN", token)
			}
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)
			if res.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
			}
		})
	}
}

func TestVerifyArtistOwnershipFailsClosedWhenInternalTokenIsNotConfigured(t *testing.T) {
	handler := New(&artistServiceStub{}, "jwt-secret", "").Routes()
	req := httptest.NewRequest(http.MethodPost, "/internal/v1/artist-ownership/verify", strings.NewReader(`{"artist_id":"00000000-0000-4000-8000-000000000001","user_id":"00000000-0000-4000-8000-000000000002"}`))
	req.Header.Set("ARTIST_INTERNAL_API_TOKEN", "any-token")
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
	}
}

func TestVerifyArtistOwnershipReturnsNoPrivateData(t *testing.T) {
	artistID, userID := uuid.New(), uuid.New()
	stub := &artistServiceStub{}
	handler := New(stub, "jwt-secret", "internal-test-token").Routes()
	body, err := json.Marshal(map[string]string{"artist_id": artistID.String(), "user_id": userID.String()})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodPost, "/internal/v1/artist-ownership/verify", bytes.NewReader(body))
	req.Header.Set("ARTIST_INTERNAL_API_TOKEN", "internal-test-token")
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d; body: %s", res.Code, http.StatusNoContent, res.Body.String())
	}
	if stub.verifiedArtistID != artistID || stub.verifiedUserID != userID {
		t.Fatalf("verified (%s, %s), want (%s, %s)", stub.verifiedArtistID, stub.verifiedUserID, artistID, userID)
	}
	if res.Body.Len() != 0 {
		t.Fatalf("success response should be empty, got %q", res.Body.String())
	}
}

func TestVerifyArtistOwnershipReturnsGenericFailure(t *testing.T) {
	artistID, userID := uuid.New(), uuid.New()
	stub := &artistServiceStub{verifyErr: service.ErrForbidden}
	handler := New(stub, "jwt-secret", "internal-test-token").Routes()
	body, err := json.Marshal(map[string]string{"artist_id": artistID.String(), "user_id": userID.String()})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodPost, "/internal/v1/artist-ownership/verify", bytes.NewReader(body))
	req.Header.Set("ARTIST_INTERNAL_API_TOKEN", "internal-test-token")
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	if res.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusForbidden)
	}
	if strings.Contains(res.Body.String(), userID.String()) || strings.Contains(res.Body.String(), artistID.String()) {
		t.Fatalf("failure response exposed request identity: %s", res.Body.String())
	}
}
