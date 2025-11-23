from fastapi import APIRouter, HTTPException, Query
from api.schemas import RecentImagesResponse
from services.image_service import ImageService

# Create router
router = APIRouter(prefix="/api/images", tags=["images"])

# Initialize the image service
image_service = ImageService()


@router.get("/recent", response_model=RecentImagesResponse)
async def get_recent_images(
    limit: int = Query(default=50, ge=1, le=200, description="Maximum number of images to return"),
    offset: int = Query(default=0, ge=0, description="Number of images to skip (for pagination)")
):
    """
    Get recent images uploaded by users, ordered by uploaded_at descending.
    Includes plant information.
    
    Args:
        limit: Maximum number of images to return (1-200)
        offset: Number of images to skip (for pagination)
    
    Returns:
        Dictionary with recent images and count
    """
    try:
        images = image_service.get_recent_images(limit=limit, offset=offset)
        
        return RecentImagesResponse(
            success=True,
            images=images,
            count=len(images)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching recent images: {str(e)}"
        )


@router.get("/plant/{plant_id}")
async def get_images_by_plant_id(plant_id: str):
    """
    Get all images for a specific plant by plant ID.
    
    Args:
        plant_id: UUID of the plant
    
    Returns:
        Dictionary with images for the plant
    """
    try:
        images = image_service.get_images_by_plant_id(plant_id)
        
        return {
            "success": True,
            "plant_id": plant_id,
            "images": images,
            "count": len(images)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching images for plant: {str(e)}"
        )

