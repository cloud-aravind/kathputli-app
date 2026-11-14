ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Existing order totals were artwork-only, so retain their historical value
-- as subtotal and leave shipping at zero.
UPDATE orders
SET subtotal = total_price
WHERE subtotal = 0
  AND shipping_amount = 0
  AND total_price > 0;
