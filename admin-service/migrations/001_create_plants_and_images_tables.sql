-- ============================================================================
-- Plant Database Schema Migration
-- ============================================================================
-- This migration creates the plants and plant_images tables with their
-- relationships, indexes, and triggers.
-- 
-- Tables:
--   - plants: Stores plant data from Excel uploads
--   - plant_images: Stores multiple images per plant (one-to-many relationship)
-- ============================================================================

-- ============================================================================
-- DROP EXISTING OBJECTS (for idempotent execution)
-- ============================================================================

-- Drop triggers first (they depend on tables)
DROP TRIGGER IF EXISTS update_plants_updated_at ON plants;

-- Drop functions
DROP FUNCTION IF EXISTS get_plant_image_urls(UUID);
DROP FUNCTION IF EXISTS get_plant_main_image_url(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (drop in reverse dependency order)
DROP TABLE IF EXISTS user_plant_images CASCADE;
DROP TABLE IF EXISTS plants CASCADE;

-- ============================================================================
-- PLANTS TABLE
-- ============================================================================
-- Stores all plant information from Excel file uploads
-- Each plant is uniquely identified by (scientific_name, dome)

CREATE TABLE IF NOT EXISTS plants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    common_name TEXT,
    scientific_name TEXT NOT NULL,
    qty TEXT,
    buy_new_wont_survive BOOLEAN DEFAULT FALSE,
    buy_new_readily_available BOOLEAN DEFAULT FALSE,
    move_it_staff_can_do BOOLEAN DEFAULT FALSE,
    move_it_requires_consult BOOLEAN DEFAULT FALSE,
    notes TEXT,
    display BOOLEAN DEFAULT FALSE,
    stop TEXT,
    dome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scientific_name, dome) -- Ensure unique plant per dome
);

-- Indexes for plants table
CREATE INDEX IF NOT EXISTS idx_plants_scientific_name ON plants(scientific_name);
CREATE INDEX IF NOT EXISTS idx_plants_dome ON plants(dome);
CREATE INDEX IF NOT EXISTS idx_plants_common_name ON plants(common_name);
CREATE INDEX IF NOT EXISTS idx_plants_created_at ON plants(created_at DESC);

-- Trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on plant updates
CREATE TRIGGER update_plants_updated_at 
    BEFORE UPDATE ON plants
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE plants IS 'Stores plant data from Excel file uploads. Each plant is uniquely identified by scientific_name and dome.';

-- ============================================================================
-- PLANT_IMAGES TABLE
-- ============================================================================
-- Stores multiple images per plant (one-to-many relationship)
-- Images are uploaded through the user-service and stored in Supabase storage

CREATE TABLE IF NOT EXISTS user_plant_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- URL to image in Supabase storage bucket
    uploaded_by TEXT, -- Optional: user ID or identifier who uploaded the image
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure image_url is not empty
    CONSTRAINT plant_images_image_url_not_empty CHECK (length(trim(image_url)) > 0)
);

-- Indexes for plant_images table
CREATE INDEX IF NOT EXISTS idx_plant_images_plant_id ON user_plant_images(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_images_uploaded_at ON user_plant_images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_plant_images_plant_id_uploaded_at ON user_plant_images(plant_id, uploaded_at DESC);

-- Add table comment
COMMENT ON TABLE user_plant_images IS 'Stores multiple images for each plant. Images are uploaded through user-service and stored in Supabase storage bucket. One-to-many relationship with plants table.';

-- Add column comments
COMMENT ON COLUMN user_plant_images.plant_id IS 'Foreign key reference to plants.id. Cascade delete removes all images when plant is deleted.';
COMMENT ON COLUMN user_plant_images.image_url IS 'Public URL to the image stored in Supabase storage bucket (plant-images).';

-- ============================================================================
-- HELPER FUNCTIONS (Optional but useful)
-- ============================================================================

-- Function to get the first image URL for a plant
CREATE OR REPLACE FUNCTION get_plant_main_image_url(p_plant_id UUID)
RETURNS TEXT AS $$
DECLARE
    main_image_url TEXT;
BEGIN
    SELECT image_url INTO main_image_url
    FROM user_plant_images
    WHERE plant_id = p_plant_id
    ORDER BY uploaded_at DESC
    LIMIT 1;
    
    RETURN main_image_url;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all image URLs for a plant
CREATE OR REPLACE FUNCTION get_plant_image_urls(p_plant_id UUID)
RETURNS TABLE(image_url TEXT, uploaded_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.image_url,
        pi.uploaded_at
    FROM user_plant_images pi
    WHERE pi.plant_id = p_plant_id
    ORDER BY pi.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VERIFICATION QUERIES (for testing after migration)
-- ============================================================================
-- Uncomment and run these after the migration to verify everything works:
--
-- -- Check if tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('plants', 'user_plant_images');
--
-- -- Check foreign key constraint
-- SELECT 
--     tc.constraint_name, 
--     tc.table_name, 
--     kcu.column_name,
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_name = 'user_plant_images';
--
-- -- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('plants', 'user_plant_images')
-- ORDER BY tablename, indexname;

