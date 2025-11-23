-- ============================================================================
-- Add Health Assessment Columns to user_plant_images Table
-- ============================================================================
-- This migration adds health assessment data to the user_plant_images table.
-- Health assessment is performed using BioCLIP after plant identification is confirmed.

-- Add health assessment columns
ALTER TABLE user_plant_images
ADD COLUMN IF NOT EXISTS health_status TEXT, -- Overall status: 'healthy', 'watch', 'declining', 'critical', 'unknown'
ADD COLUMN IF NOT EXISTS health_score INTEGER, -- Health score from 0-100
ADD COLUMN IF NOT EXISTS health_confidence FLOAT, -- Confidence in health assessment (0.0-1.0)
ADD COLUMN IF NOT EXISTS health_assessment JSONB; -- Full health assessment data (observations, issues, recommendations, etc.)

-- Add index for health status queries
CREATE INDEX IF NOT EXISTS idx_plant_images_health_status ON user_plant_images(health_status);
CREATE INDEX IF NOT EXISTS idx_plant_images_health_score ON user_plant_images(health_score);
CREATE INDEX IF NOT EXISTS idx_plant_images_plant_id_health_status ON user_plant_images(plant_id, health_status);

-- Add column comments
COMMENT ON COLUMN user_plant_images.health_status IS 'Overall plant health status: healthy, watch, declining, critical, or unknown';
COMMENT ON COLUMN user_plant_images.health_score IS 'Health score from 0-100, where 100 is perfectly healthy';
COMMENT ON COLUMN user_plant_images.health_confidence IS 'Confidence in health assessment from 0.0 to 1.0';
COMMENT ON COLUMN user_plant_images.health_assessment IS 'Full health assessment JSON containing observations, issues detected, recommendations, and monitoring notes';

