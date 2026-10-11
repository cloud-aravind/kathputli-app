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
	baseURL string
	client  *http.Client
}

type artistResponse struct {
	ID     uuid.UUID `json:"id"`
	UserID uuid.UUID `json:"user_id"`
}

func NewArtistClient(baseURL string) *ArtistClient {
	return &ArtistClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		client:  &http.Client{Timeout: 5 * time.Second},
	}
}

// VerifyOwnership confirms that userID owns artistID.
func (c *ArtistClient) VerifyOwnership(ctx context.Context, userID, artistID uuid.UUID) error {
	if userID == uuid.Nil || artistID == uuid.Nil {
		return fmt.Errorf("invalid ownership identifiers")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		c.baseURL+"/api/artists/"+artistID.String(), nil)
	if err != nil {
		return fmt.Errorf("build artist request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("artist service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return ErrNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("artist service returned status %d", resp.StatusCode)
	}

	var artist artistResponse
	if err := json.NewDecoder(resp.Body).Decode(&artist); err != nil {
		return fmt.Errorf("decode artist response: %w", err)
	}

	if artist.ID != artistID || artist.UserID != userID {
		return ErrForbidden
	}
	return nil
}
