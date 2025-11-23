import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Create Supabase client
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Test query to see what's in the plants table
print("Querying plants table...")
response = supabase.table("plants").select("*").limit(1).execute()

if response.data:
    print(f"\nColumns in plants table:")
    for key in response.data[0].keys():
        value = response.data[0][key]
        value_preview = str(value)[:50] if value else "None"
        print(f"  - {key}: {value_preview}")
else:
    print("No plants found in database!")
    print("Response:", response)
