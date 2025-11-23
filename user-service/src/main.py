import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes as game_routes
from game_utils.plant_classifier import PlantClassifier
from dotenv import load_dotenv

import uvicorn

# Load environment variables
load_dotenv()

# Validate required environment variables on startup
def validate_environment_variables():
    """Validate that all required environment variables are set."""
    required_vars = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_SECRET_KEY": os.getenv("SUPABASE_SECRET_KEY"),
        "SUPABASE_PUBLISHABLE_KEY": os.getenv("SUPABASE_PUBLISHABLE_KEY"),
        "TAVILY_API_KEY": os.getenv("TAVILY_API_KEY"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
    }
    
    missing_vars = []
    
    # Check SUPABASE_URL (required)
    if not required_vars["SUPABASE_URL"]:
        missing_vars.append("SUPABASE_URL")
    
    # Check Supabase keys (at least one is required)
    if not required_vars["SUPABASE_SECRET_KEY"] and not required_vars["SUPABASE_PUBLISHABLE_KEY"]:
        missing_vars.append("SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY")
    
    # Check TAVILY_API_KEY (required)
    if not required_vars["TAVILY_API_KEY"]:
        missing_vars.append("TAVILY_API_KEY")
    
    # Check OPENAI_API_KEY (required)
    if not required_vars["OPENAI_API_KEY"]:
        missing_vars.append("OPENAI_API_KEY")
    
    if missing_vars:
        error_message = (
            "Missing required environment variables:\n"
            + "\n".join(f"  - {var}" for var in missing_vars)
            + "\n\nPlease set these in your .env file. See env.template for reference."
        )
        raise ValueError(error_message)

# Create FastAPI app
app = FastAPI(
    title="Plant Game Admin API",
    description="API for the HacksGiving 2025 Plant Game Admin",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event - Validate env vars and load BioCLIP model
@app.on_event("startup")
async def startup_event():
    """Validate environment variables and load the plant classifier model on startup"""
    print("Starting up application...")
    
    # Validate environment variables first
    print("Validating environment variables...")
    try:
        validate_environment_variables()
        print("✓ All required environment variables are set")
    except ValueError as e:
        print(f"✗ Environment validation failed: {e}")
        raise
    
    # Load BioCLIP model and plant database
    print("Loading BioCLIP model and plant database...")
    # This triggers the model loading and caching
    # The first instance loads everything, subsequent instances use the cache
    classifier = PlantClassifier()
    
    print("Application startup complete!")

# Include routers
app.include_router(game_routes.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8003)