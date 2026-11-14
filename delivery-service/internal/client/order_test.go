package client

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestVerifyOwnershipForwardsCustomerAuthorization(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet || r.URL.Path != "/api/orders/order-123" {
			t.Errorf("request = %s %s, want GET /api/orders/order-123", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer customer-token" {
			t.Errorf("Authorization = %q, want forwarded customer token", got)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := NewOrderService(server.URL)
	if err := client.VerifyOwnership(context.Background(), "order-123", "Bearer customer-token"); err != nil {
		t.Fatalf("VerifyOwnership() error = %v", err)
	}
}

func TestVerifyOwnershipHidesMissingAndUnownedOrders(t *testing.T) {
	for _, status := range []int{http.StatusUnauthorized, http.StatusForbidden, http.StatusNotFound} {
		t.Run(http.StatusText(status), func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(status)
			}))
			defer server.Close()

			client := NewOrderService(server.URL)
			err := client.VerifyOwnership(context.Background(), "order-123", "Bearer customer-token")
			if !errors.Is(err, ErrOrderNotFound) {
				t.Fatalf("VerifyOwnership() error = %v, want ErrOrderNotFound", err)
			}
		})
	}
}

func TestVerifyOwnershipReturnsUpstreamFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	client := NewOrderService(server.URL)
	if err := client.VerifyOwnership(context.Background(), "order-123", "Bearer customer-token"); err == nil {
		t.Fatal("VerifyOwnership() returned nil for upstream failure")
	}
}
