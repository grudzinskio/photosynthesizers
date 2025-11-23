from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from schemas import SummaryRequest, SummaryResponse, QuestionRequest, QuestionResponse
from plant_game import PlantGame
from game_utils.database_handler import DatabaseHandler

# Create router
router = APIRouter(prefix="/api/game", tags=["plant-game"])

# Initialize the game service
database_handler = DatabaseHandler()

@router.get("/start-game")
async def create_game(dome_type: str):
    """
    Create a game for a given dome type. 
    This happens when the user clicks their choice of dome.
    This will set the dome type in the game.
    """
    try:
        game = PlantGame(dome_type=dome_type) # plant_name is None at this point
        plant_name = game.get_random_plant()
        plant_image = game.database_handler.get_main_plant_image(plant_name)
        return {
            "success": True,
            "plant_name": plant_name,
            "plant_image": plant_image
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating game: {str(e)}"
        )


@router.post("/submit-image")
async def submit_plant_image(image: UploadFile = File(...), dome_type: str = Form(...), plant_name: str = Form(...)):
    """
    Submit plant image for verification.
    Classifies the image and returns success if it matches the target plant.
    """
    try:
        # Read image bytes
        image_bytes = await image.read()

        # Reset the game instance
        game = PlantGame(dome_type=dome_type, plant_name=plant_name)
        
        # Process through game logic
        result = game.verify_and_upload_image(image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@router.post("/summarize")
async def summarize_plant(dome_type: str = Form(...), plant_name: str = Form(...)):
    """
    Get a summary of a plant.
    If plant_name is provided, summarizes that plant.
    Otherwise, summarizes the current plant from the game.
    """
    try:
        # Reset the game instance
        game = PlantGame(dome_type=dome_type, plant_name=plant_name)
        result = game.summarize_plant()
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400, 
                detail=result.get("error", "Failed to summarize plant")
            )
        
        return {
            "plant_name": result["plant_name"],
            "summary": result["summary"],
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )


@router.post("/ask-question")
async def ask_plant_question(dome_type: str = Form(...), plant_name: str = Form(...), question: str = Form(...)):
    """
    Ask a follow-up question about the current plant.
    The game must have a current plant set (from get_random_plant).
    """
    try:
        # Reset the game instance
        game = PlantGame(dome_type=dome_type, plant_name=plant_name)
        result = game.answer_plant_question(question)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to answer question")
            )
        
        return {
            "plant_name": result["plant_name"],
            "question": question,
            "answer": result["answer"],
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error answering question: {str(e)}"
        )