from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes as game_routes
from game_utils.plant_classifier import PlantClassifier

import uvicorn

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

# Startup event - Load BioCLIP model once
@app.on_event("startup")
async def startup_event():
    """Load the plant classifier model on startup"""
    print("Starting up application...")
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