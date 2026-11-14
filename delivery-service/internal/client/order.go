package client

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var ErrOrderNotFound = errors.New("order not found or not owned by customer")

type OrderService struct {
	baseURL    string
	httpClient *http.Client
}

func NewOrderService(baseURL string) *OrderService {
	return &OrderService{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// VerifyOwnership delegates the ownership decision to Order Service, which
// validates the forwarded customer JWT before returning an order.
func (c *OrderService) VerifyOwnership(ctx context.Context, orderID, authorization string) error {
	if strings.TrimSpace(authorization) == "" {
		return ErrOrderNotFound
	}

	requestURL := c.baseURL + "/api/orders/" + url.PathEscape(orderID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return fmt.Errorf("create order ownership request: %w", err)
	}
	req.Header.Set("Authorization", authorization)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request order ownership: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		return nil
	case http.StatusUnauthorized, http.StatusForbidden, http.StatusNotFound:
		return ErrOrderNotFound
	default:
		return fmt.Errorf("order service ownership check returned HTTP %d", resp.StatusCode)
	}
}
