from typing import Optional, Dict
from services.plant_service import PlantService
from services.image_service import ImageService


class SupabaseHandler:
    """
    Handler for Supabase database and storage operations.
    Uses services to interact with Supabase.
    """

    def __init__(self):
        """
        Initialize the Supabase handler with services.
        """
        self.plant_service = PlantService()
        self.image_service = ImageService()

    # PLANTS TABLE - USED FOR GETTING PLANTS BY SCIENTIFIC NAME

    def get_plant_by_scientific_name(self, scientific_name: str, dome: Optional[str] = None) -> Optional[Dict]:
        """
        Get a plant by its scientific name.
        If dome is provided, filters by dome as well.
        
        Args:
            scientific_name: Scientific name of the plant
            dome: Optional dome name to filter by
            
        Returns:
            Plant dictionary or None if not found
        """
        return self.plant_service.get_plant_by_scientific_name(scientific_name, dome)

    def get_all_plants_by_scientific_name(self) -> list[dict]:
        """
        Get all plants from the database by scientific name.
        
        Returns:
            List of plant dictionaries
        """
        return self.plant_service.get_all_plants_by_scientific_name()

    def get_plant_id_by_scientific_name_and_dome(self, scientific_name: str, dome: str) -> Optional[str]:
        """
        Get plant ID by scientific name and dome.
        
        Args:
            scientific_name: Scientific name of the plant
            dome: Dome name
            
        Returns:
            Plant ID (UUID) or None if not found
        """
        return self.plant_service.get_plant_id_by_scientific_name_and_dome(scientific_name, dome)

    # USER_PLANT_IMAGES TABLE - USED FOR ADDING AND GETTING ALL USER PLANT IMAGES

    def upload_user_plant_image(self, scientific_name: str, dome: str, image: bytes, uploaded_by: Optional[str] = None) -> Dict:
        """
        Upload a user's plant image to Supabase storage and save the record to the database.
        
        Steps:
        1. Get the plant_id from scientific_name and dome
        2. Upload image to Supabase storage bucket "plant-images"
        3. Save the image URL to user_plant_images table
        
        Args:
            scientific_name: Scientific name of the plant
            dome: Dome name where the plant is located
            image: Image bytes to upload
            uploaded_by: Optional identifier for who uploaded the image
            
        Returns:
            Dictionary with success status and image data or error message
        """
        # Step 1: Get plant_id from scientific_name and dome
        plant_id = self.get_plant_id_by_scientific_name_and_dome(scientific_name, dome)
        if not plant_id:
            return {
                "success": False,
                "error": f"Plant '{scientific_name}' not found in dome '{dome}'"
            }
        
        # Step 2 & 3: Upload image and save to database (handled by image_service)
        return self.image_service.upload_user_plant_image(plant_id, image, uploaded_by)
