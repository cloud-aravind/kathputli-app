package client

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "strings"
    "time"

    "github.com/google/uuid"

    "github.com/kathputli/order-service/internal/model"
)

type ArtworkClient struct {
    baseURL    string
    httpClient *http.Client
}

func NewArtworkClient(baseURL string) *ArtworkClient {
    return &ArtworkClient{
        baseURL: strings.TrimRight(baseURL, "/"),
        httpClient: &http.Client{Timeout: 5 * time.Second},
    }
}

func (c *ArtworkClient) GetArtwork(ctx context.Context, artworkID uuid.UUID) (*model.ArtworkDetails, error) {
    url := fmt.Sprintf("%s/api/artworks/%s", c.baseURL, artworkID.String())

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("create artwork request: %w", err)
    }

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("artwork service request failed: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode == http.StatusNotFound {
        return nil, fmt.Errorf("artwork not found")
    }
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("artwork service returned status %d", resp.StatusCode)
    }

    var artwork model.ArtworkDetails
    if err := json.NewDecoder(resp.Body).Decode(&artwork); err != nil {
        return nil, fmt.Errorf("decode artwork response: %w", err)
    }

    return &artwork, nil
}
