# Database Migrations

This directory contains SQL migrations for setting up the database schema.

## Setup Instructions

### 1. Run the SQL Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `001_create_plants_and_images_tables.sql`
4. Execute the SQL script

This will create both the `plants` and `plant_images` tables with all their relationships, indexes, and triggers.

Alternatively, you can use the Supabase CLI:
```bash
supabase db push
```

### 2. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New bucket**
4. Name: `plant-images`
5. **Public bucket**: Check this box (so images can be accessed via URL)
6. Click **Create bucket**

### 3. Set Bucket Policies (Optional - for public access)

If you want the bucket to be publicly accessible:

1. Go to **Storage** > **Policies** > `plant-images`
2. Create a new policy:
   - Policy name: `Public read access`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Policy definition: `true`

For uploads, you'll need to handle authentication in your application.

### 4. Environment Variables

Make sure your `.env` file contains:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

## Migration Files

- `001_create_plants_and_images_tables.sql` - Creates both the `plants` and `plant_images` tables with their relationships, indexes, triggers, and helper functions
- `003_setup_storage_bucket.sql` - SQL script for setting up storage bucket policies (bucket must be created through Dashboard or API)

## Notes

- The `plants` table uses `(scientific_name, dome)` as a unique constraint to ensure no duplicate plants per dome
- The `plant_images` table has a one-to-many relationship with `plants` (one plant can have many images)
- Images are stored in the `plant-images` bucket with path structure: `{plant_id}/{file_name}`
- The `image_url` field in the `plants` table is a legacy field (deprecated, use `plant_images` table instead)
- Only one image per plant can be marked as the main image (`is_main_image = TRUE`)
- Helper functions are included: `get_plant_main_image_url()` and `get_plant_image_urls()`
- **Image uploads are handled by the user-service**, not the admin-service
- The admin-service only saves plant data from Excel file uploads
- When a plant is deleted, all associated images are automatically deleted (CASCADE)

