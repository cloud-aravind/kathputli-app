-- Idempotently seed remaining catalogue artworks under the verified artist profile
-- (UUID 7a096bf4-4cac-446b-b460-9b01771d339f, associated with Final Traditional Artwork and The Living Tradition).
-- Run against the kathputli_artwork database.
DO $$
DECLARE
    v_artist_id UUID;
    v_cat_paintings UUID;
    v_cat_digital UUID;
    v_cat_famous UUID;
    v_cat_sculptures UUID;
    v_cat_photography UUID;
    v_artwork_id UUID;
BEGIN
    SELECT artist_id
      INTO v_artist_id
      FROM artworks
     WHERE id = '960dae66-ecaf-454a-b6d5-14d72041fd0d'::UUID;

    IF v_artist_id IS NULL THEN
        RAISE EXCEPTION 'Source artist association not found. No changes made.';
    END IF;

    -- Upsert categories for this artist
    INSERT INTO categories (id, artist_id, name, slug)
    VALUES (gen_random_uuid(), v_artist_id, 'Paintings', 'paintings')
    ON CONFLICT (artist_id, name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_cat_paintings;

    INSERT INTO categories (id, artist_id, name, slug)
    VALUES (gen_random_uuid(), v_artist_id, 'Digital Art', 'digital-art')
    ON CONFLICT (artist_id, name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_cat_digital;

    INSERT INTO categories (id, artist_id, name, slug)
    VALUES (gen_random_uuid(), v_artist_id, 'Famous Artworks', 'famous-artworks')
    ON CONFLICT (artist_id, name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_cat_famous;

    INSERT INTO categories (id, artist_id, name, slug)
    VALUES (gen_random_uuid(), v_artist_id, 'Sculptures', 'sculptures')
    ON CONFLICT (artist_id, name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_cat_sculptures;

    INSERT INTO categories (id, artist_id, name, slug)
    VALUES (gen_random_uuid(), v_artist_id, 'Photography', 'photography')
    ON CONFLICT (artist_id, name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_cat_photography;

    -- 1. Golden Reflections (Ananya Rao)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Golden Reflections') AND image_url = '/category-paintings.jpg'
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_paintings, 'Golden Reflections', 'Golden Reflections by Ananya Rao', 650.00, 'INR', '/category-paintings.jpg', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 2. Blooming Hues (Maya Sen)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Blooming Hues')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_digital, 'Blooming Hues', 'Blooming Hues by Maya Sen', 420.00, 'INR', '/category-digital-art.jpg', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 3. The Lady with an Ermine (Leonardo da Vinci)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('The Lady with an Ermine')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_famous, 'The Lady with an Ermine', 'The Lady with an Ermine by Leonardo da Vinci', 900.00, 'INR', '/category-famous-artworks.jpg', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 4. Marble Heritage (Classical Collection)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Marble Heritage')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_sculptures, 'Marble Heritage', 'Marble Heritage by Classical Collection', 1200.00, 'INR', '/category-sculptures.jpg', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 5. Faces of Art (Elena Martin)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Faces of Art')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_photography, 'Faces of Art', 'Faces of Art by Elena Martin', 760.00, 'INR', '/category-photography.jpg', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 6. Golden Reflections (Bhavya Rao)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Golden Reflections') AND image_url = '/bhavya-pic-1.png'
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_paintings, 'Golden Reflections', 'Golden Reflections by Bhavya Rao - Oil on Canvas', 650.00, 'INR', '/bhavya-pic-1.png', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 7. Blooming Peonies (Bhavya Rao)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Blooming Peonies')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_paintings, 'Blooming Peonies', 'Blooming Peonies by Bhavya Rao - Oil on Canvas', 600.00, 'INR', '/bhavya-pic-2.png', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 8. Mountain Serenity (Bhavya Rao)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Mountain Serenity')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_paintings, 'Mountain Serenity', 'Mountain Serenity by Bhavya Rao - Oil on Canvas', 580.00, 'INR', '/bhavya-pic-3.png', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 9. City Lights (Bhavya Rao)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('City Lights')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_paintings, 'City Lights', 'City Lights by Bhavya Rao - Acrylic on Canvas', 540.00, 'INR', '/bhavya-pic-4.png', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 10. Sunset Hues (Bhavya Rao)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Sunset Hues')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_paintings, 'Sunset Hues', 'Sunset Hues by Bhavya Rao - Oil on Canvas', 480.00, 'INR', '/bhavya-pic-5.png', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

    -- 11. Wildflowers (Bhavya Rao)
    SELECT id INTO v_artwork_id FROM artworks
     WHERE artist_id = v_artist_id AND lower(title) = lower('Wildflowers')
     LIMIT 1;
    IF v_artwork_id IS NULL THEN v_artwork_id := gen_random_uuid(); END IF;
    INSERT INTO artworks (id, artist_id, category_id, title, description, price, currency, image_url, stock, is_active)
    VALUES (v_artwork_id, v_artist_id, v_cat_paintings, 'Wildflowers', 'Wildflowers by Bhavya Rao - Oil on Canvas', 490.00, 'INR', '/bhavya-pic-6.png', 5, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description,
        price = EXCLUDED.price, currency = EXCLUDED.currency, image_url = EXCLUDED.image_url, stock = EXCLUDED.stock, is_active = TRUE, updated_at = NOW();

END $$;

-- Verify all catalogue artworks in kathputli_artwork
SELECT a.id, a.title, c.name AS category, a.price, a.currency, a.image_url, a.stock, a.is_active
FROM artworks a
LEFT JOIN categories c ON c.id = a.category_id
ORDER BY a.created_at;
