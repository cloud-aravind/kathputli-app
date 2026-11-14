package client

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	ErrNotFound  = errors.New("artist not found")
	ErrForbidden = errors.New("artist ownership mismatch")
)

// ArtistClient validates artist ownership against the Artist Service.
type ArtistClient struct {
	baseURL          string
	internalAPIToken string
	client           *http.Client
}

type ownershipVerificationRequest struct {
	ArtistID uuid.UUID `json:"artist_id"`
	UserID   uuid.UUID `json:"user_id"`
}

func NewArtistClient(baseURL, internalAPIToken string) *ArtistClient {
	return &ArtistClient{
		baseURL:          strings.TrimRight(baseURL, "/"),
		internalAPIToken: internalAPIToken,
		client:           &http.Client{Timeout: 5 * time.Second},
	}
}

// VerifyOwnership confirms that userID owns artistID.
func (c *ArtistClient) VerifyOwnership(ctx context.Context, userID, artistID uuid.UUID) error {
	if userID == uuid.Nil || artistID == uuid.Nil {
		return fmt.Errorf("invalid ownership identifiers")
	}
	if strings.TrimSpace(c.internalAPIToken) == "" {
		return errors.New("artist internal API token is not configured")
	}

	requestBody, err := json.Marshal(ownershipVerificationRequest{
		ArtistID: artistID,
		UserID:   userID,
	})
	if err != nil {
		return fmt.Errorf("encode ownership verification request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.baseURL+"/internal/v1/artist-ownership/verify", strings.NewReader(string(requestBody)))
	if err != nil {
		return fmt.Errorf("build artist request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("ARTIST_INTERNAL_API_TOKEN", c.internalAPIToken)

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("artist service request failed: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusForbidden:
		return ErrForbidden
	case http.StatusUnauthorized:
		return errors.New("artist service rejected internal API token")
	default:
		return fmt.Errorf("artist service ownership verification returned status %d", resp.StatusCode)
	}
}
