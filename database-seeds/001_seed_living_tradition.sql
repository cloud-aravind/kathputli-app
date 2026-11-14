-- Idempotently create The Living Tradition under an artist profile already
-- represented by the existing Final Traditional Artwork record.
-- Run against the kathputli_artwork database.
DO $$
DECLARE
    v_artist_id UUID;
    v_category_id UUID;
    v_artwork_id UUID;
BEGIN
    SELECT artist_id
      INTO v_artist_id
      FROM artworks
     WHERE id = '960dae66-ecaf-454a-b6d5-14d72041fd0d'::UUID;

    IF v_artist_id IS NULL THEN
        RAISE EXCEPTION 'Could not find the existing artist association source artwork (Final Traditional Artwork). No changes made.';
    END IF;

    INSERT INTO categories (id, artist_id, name, slug)
    VALUES (gen_random_uuid(), v_artist_id, 'Traditional Art', 'traditional-art')
    ON CONFLICT (artist_id, name)
    DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_category_id;

    SELECT id
      INTO v_artwork_id
      FROM artworks
     WHERE artist_id = v_artist_id
       AND lower(title) = lower('The Living Tradition')
     ORDER BY created_at
     LIMIT 1;

    IF v_artwork_id IS NULL THEN
        v_artwork_id := gen_random_uuid();
    END IF;

    INSERT INTO artworks (
        id, artist_id, category_id, title, description, price,
        currency, image_url, stock, is_active
    ) VALUES (
        v_artwork_id,
        v_artist_id,
        v_category_id,
        'The Living Tradition',
        'A traditional artwork celebrating the richness of Indian artistic heritage.',
        580.00,
        'INR',
        '/category-traditional-art.jpg',
        5,
        TRUE
    )
    ON CONFLICT (id)
    DO UPDATE SET
        artist_id = EXCLUDED.artist_id,
        category_id = EXCLUDED.category_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        image_url = EXCLUDED.image_url,
        stock = EXCLUDED.stock,
        is_active = TRUE,
        updated_at = NOW();
END $$;

-- Confirm the seeded record and associated artist ID.
SELECT id, artist_id, category_id, title, price, currency, stock, is_active
FROM artworks
WHERE lower(title) = lower('The Living Tradition');
