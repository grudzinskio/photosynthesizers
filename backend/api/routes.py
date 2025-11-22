from fastapi import APIRouter, HTTPException
from schemas import PlantRequest, PlantResponse
from plant_summarizer import PlantSummarizer
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from plant_game import PlantGame

# Create router
router = APIRouter(prefix="/api/game", tags=["plant-game"])

# Initialize the game service
game = PlantGame()

@router.get("/random-plant")
async def get_random_plant():
    """Get a random plant for the user to find"""
    try:
        return game.get_random_plant()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting random plant: {str(e)}"
        )

@router.post("/submit-image")
async def submit_plant_image(
    plant_id: int = Form(...),
    image: UploadFile = File(...)
):
    """Submit plant image for verification"""
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Process through game logic
        result = game.verify_and_process(plant_id, image_bytes, image.filename)
        
        # Handle errors
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result.get("error"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

@router.post("/summarize", response_model=PlantResponse)
async def summarize_plant(request: PlantRequest):
    """
    Get a summary of a plant based on its name.
    
    Args:
        request: PlantRequest containing plant_name, optional model and max_tokens
        
    Returns:
        PlantResponse with the plant summary
    """
    try:
        summary = summarizer.summarize(
            plant=request.plant_name,
            model=request.model,
            max_tokens=request.max_tokens
        )
        
        return PlantResponse(
            plant_name=request.plant_name,
            summary=summary,
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )