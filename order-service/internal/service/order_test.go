package service

import (
	"math"
	"testing"
)

func TestShippingAmountForSubtotal(t *testing.T) {
	tests := []struct {
		name         string
		subtotal     float64
		wantShipping float64
		wantTotal    float64
	}{
		{name: "below free shipping threshold", subtotal: 1999.99, wantShipping: ShippingFee, wantTotal: 2049.99},
		{name: "at free shipping threshold", subtotal: FreeShippingThreshold, wantShipping: 0, wantTotal: FreeShippingThreshold},
		{name: "above free shipping threshold", subtotal: 2500, wantShipping: 0, wantTotal: 2500},
		{name: "zero subtotal", subtotal: 0, wantShipping: 0, wantTotal: 0},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotShipping, gotTotal := orderTotalsFor(test.subtotal)
			if math.Abs(gotShipping-test.wantShipping) > 0.000001 {
				t.Errorf("shipping amount = %v, want %v", gotShipping, test.wantShipping)
			}
			if math.Abs(gotTotal-test.wantTotal) > 0.000001 {
				t.Errorf("order total = %v, want %v", gotTotal, test.wantTotal)
			}
		})
	}
}
