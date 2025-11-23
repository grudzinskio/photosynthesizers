from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import excel_routes
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

# Include routers
app.include_router(excel_routes.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8004)