from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from schemas import SummaryRequest, SummaryResponse, QuestionRequest, QuestionResponse
from plant_game import PlantGame
from game_utils.database_handler import DatabaseHandler

# Create router
router = APIRouter(prefix="/api/game", tags=["plant-game"])

# Initialize the game service
game = PlantGame()
database_handler = DatabaseHandler()

@router.get("/random-plant")
async def get_random_plant():
    """
    Get a random plant for the user to find.
    Get an image of the plant from the database.
    This sets the current plant in the game.
    """
    try:
        plant_name = game.get_random_plant()
        plant = database_handler.get_plant_by_scientific_name(plant_name)
        return {
            "plant_name": plant_name,
            "success": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting random plant: {str(e)}"
        )


@router.post("/submit-image")
async def submit_plant_image(image: UploadFile = File(...)):
    """
    Submit plant image for verification.
    Classifies the image and returns success if it matches the target plant.
    """
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Process through game logic
        result = game.verify_and_upload_image(image_bytes, image.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@router.post("/summarize", response_model=SummaryResponse)
async def summarize_plant(request: SummaryRequest):
    """
    Get a summary of a plant.
    If plant_name is provided, summarizes that plant.
    Otherwise, summarizes the current plant from the game.
    """
    try:
        result = game.summarize_plant(request.plant_name)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to summarize plant")
            )
        
        return SummaryResponse(
            plant_name=result["plant_name"],
            summary=result["summary"],
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )


@router.post("/ask-question", response_model=QuestionResponse)
async def ask_plant_question(request: QuestionRequest):
    """
    Ask a follow-up question about the current plant.
    The game must have a current plant set (from get_random_plant).
    """
    try:
        result = game.answer_plant_question(request.question)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to answer question")
            )
        
        return QuestionResponse(
            answer=result["answer"],
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error answering question: {str(e)}"
        )