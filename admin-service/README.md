# Admin Service

FastAPI service for managing plant collection data from Excel files.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.template .env
   ```

2. Edit `.env` and add your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon/public key

   You can find these in your Supabase dashboard:
   - Go to Settings → API
   - Copy the Project URL and anon public key

### 3. Set Up Database

1. Run the SQL migration to create the plants table:
   - See `migrations/README.md` for instructions
   - Or run `migrations/001_create_plants_table.sql` in your Supabase SQL Editor

2. Create the storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a new bucket named `plant-images`
   - Make it public

See `SUPABASE_SETUP.md` for detailed setup instructions.

### 4. Run the Service

```bash
python src/main.py
```

The service will run on `http://localhost:8004`

## API Endpoints

### Excel Upload
- `POST /api/excel/upload` - Upload and parse Excel file containing plant data

### Excel Data
- `GET /api/excel/statistics` - Get statistics about loaded Excel data
- `GET /api/excel/domes` - Get list of available domes
- `GET /api/excel/plants/{dome_name}` - Get plants from a specific dome (paginated)
- `GET /api/excel/plant/{dome_name}/{index}` - Get a specific plant by index
- `GET /api/excel/search/{dome_name}` - Search plants in a dome

### Health Check
- `GET /health` - Health check endpoint

## Features

- Upload Excel files containing plant collection data
- Automatically save plants to Supabase database
- Parse and organize plants by dome
- Query and search plant data
- Support for pagination and filtering

## Notes

- Image uploads are handled by the `user-service`, not this service
- This service only manages plant data from Excel uploads
- Plants are automatically saved to the database when Excel files are uploaded

