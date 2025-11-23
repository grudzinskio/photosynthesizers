# Supabase Setup Guide

This guide explains how to set up Supabase for the admin service to store plants and images.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Your Supabase project URL and anon key

## Setup Steps

### 1. Create the Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/001_create_plants_and_images_tables.sql`
4. Click **Run** to execute the SQL

This will create:
- **`plants` table** with all necessary columns:
  - Indexes for faster queries (scientific_name, dome, common_name, created_at)
  - Unique constraint on `(scientific_name, dome)` to ensure no duplicate plants per dome
  - Auto-updating `updated_at` timestamp via trigger
  - Helper functions for retrieving plant images
  
- **`plant_images` table** for storing multiple images per plant:
  - Foreign key relationship to `plants` table with CASCADE delete
  - One-to-many relationship (one plant can have many images)
  - Unique constraint to ensure only one main image per plant
  - Indexes for faster queries (plant_id, is_main_image, uploaded_at)
  - Support for metadata storage (JSONB field)
  - Helper functions for retrieving main image and all images for a plant

### 2. Create Storage Bucket

1. Go to **Storage** in the sidebar
2. Click **New bucket**
3. Configure:
   - **Name**: `plant-images`
   - **Public bucket**: ✅ Check this (required for public image URLs)
   - **File size limit**: 10MB (or adjust as needed)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`
4. Click **Create bucket**

**Alternative**: You can also run the SQL script `migrations/003_setup_storage_bucket.sql` in the SQL Editor, but the bucket itself must be created through the Dashboard or Storage API.

### 3. Configure Environment Variables

Create or update your `.env` file in the `admin-service` directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

You can find these values in:
- Supabase Dashboard → Settings → API

### 4. (Optional) Set Bucket Policies

If you want public read access to images:

1. Go to **Storage** → **Policies** → `plant-images`
2. Click **New Policy**
3. Configure:
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **Policy definition**: `true`
4. Click **Save**

For uploads, the application will handle authentication through the service role key.

## How It Works

### When Excel Files Are Uploaded

1. The Excel file is parsed into plant records
2. Each plant is saved to the `plants` table in Supabase
3. If a plant with the same `(scientific_name, dome)` exists, it's updated
4. New plants are inserted

### Image Storage

- Images are stored in the `plant-images` bucket
- Path structure: `{plant_id}/{file_name}`
- Multiple images can be linked to each plant through the `plant_images` table
- The `plant_images` table stores:
  - `plant_id`: Foreign key to the `plants` table
  - `image_url`: URL to the image in Supabase storage
  - `is_main_image`: Boolean flag to mark the primary image
  - `uploaded_by`: Optional identifier of who uploaded the image
  - `metadata`: Optional JSONB field for additional image metadata
- **Note**: Image uploads are handled by the `user-service`, not the `admin-service`
  - Users upload images as part of the plant guessing game
  - The admin-service only saves plant data from Excel files
  - The `user-service` should insert records into `plant_images` when images are uploaded

## Database Schema

### Plants Table
The `plants` table includes:
- `id` (UUID, primary key)
- `common_name` (TEXT)
- `scientific_name` (TEXT, required)
- `qty` (INTEGER)
- `dome` (TEXT, required)
- `image_url` (TEXT, nullable) - Legacy field, consider using `plant_images` table instead
- Boolean fields for plant status
- `created_at` and `updated_at` timestamps

Unique constraint: `(scientific_name, dome)` ensures no duplicate plants per dome.

### Plant Images Table
The `plant_images` table includes:
- `id` (UUID, primary key)
- `plant_id` (UUID, foreign key to `plants.id`)
- `image_url` (TEXT, required) - URL to image in Supabase storage
- `uploaded_by` (TEXT, nullable) - Optional user identifier
- `is_main_image` (BOOLEAN) - Flag for primary image
- `metadata` (JSONB, nullable) - Optional additional metadata
- `uploaded_at` and `created_at` timestamps

Relationship: One plant can have many images (one-to-many).

## Notes

- RLS (Row Level Security) is **disabled** as requested
- The bucket is public for easy image access
- Plants are automatically saved when Excel files are uploaded
- Image URLs are stored in the database for quick access
- **Image uploads are handled by the user-service** where users play the plant guessing game
- The admin-service only manages plant data from Excel uploads

