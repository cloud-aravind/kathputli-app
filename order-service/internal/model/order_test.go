package model

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestOrderJSONIncludesAuthoritativeTotals(t *testing.T) {
	order := Order{
		ID:             uuid.New(),
		Subtotal:       125,
		ShippingAmount: 50,
		TotalPrice:     175,
		CreatedAt:      time.Now().UTC(),
		UpdatedAt:      time.Now().UTC(),
	}

	data, err := json.Marshal(order)
	if err != nil {
		t.Fatal(err)
	}

	var response map[string]json.RawMessage
	if err := json.Unmarshal(data, &response); err != nil {
		t.Fatal(err)
	}

	for field, want := range map[string]float64{
		"subtotal":        125,
		"shipping_amount": 50,
		"total_price":     175,
	} {
		raw, ok := response[field]
		if !ok {
			t.Errorf("response missing %q: %s", field, data)
			continue
		}
		var got float64
		if err := json.Unmarshal(raw, &got); err != nil {
			t.Errorf("response field %q is not numeric: %s", field, raw)
			continue
		}
		if got != want {
			t.Errorf("response field %q = %v, want %v", field, got, want)
		}
	}
}
