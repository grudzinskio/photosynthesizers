"""
Image service for managing plant images in Supabase storage and database.
Handles image uploads to storage and database operations for user_plant_images table.
"""
import uuid
from typing import Dict, Optional
from supabase_client import get_client


class ImageService:
    """Service for image-related storage and database operations."""
    
    def __init__(self):
        """Initialize the image service with Supabase client."""
        self.client = get_client()
        self.table = "user_plant_images"
        self.storage_bucket = "plant-images"
    
    def upload_user_plant_image(self, plant_id: str, image: bytes, health_assessment: Optional[Dict] = None) -> Dict:
        """
        Upload a user's plant image to Supabase storage and save the record to the database.
        
        Steps:
        1. Upload image to Supabase storage bucket "plant-images"
        2. Get the public URL for the uploaded image
        3. Save the image URL and health assessment to user_plant_images table
        
        Args:
            plant_id: UUID of the plant
            image: Image bytes to upload
            health_assessment: Optional health assessment dictionary from PlantHealthAssessor
            
        Returns:
            Dictionary with success status and image data or error message
        """
        try:
            # Step 1: Upload image to Supabase storage bucket
            # Generate a unique filename
            file_extension = "jpg"  # Default to jpg, could be determined from image bytes
            filename = f"{plant_id}/{uuid.uuid4()}.{file_extension}"
            
            # Upload to storage bucket
            storage_response = self.client.storage.from_(self.storage_bucket).upload(
                path=filename,
                file=image,
                file_options={"content-type": "image/jpeg", "upsert": "false"}
            )
            
            # Step 2: Get the public URL for the uploaded image
            image_url = self.client.storage.from_(self.storage_bucket).get_public_url(filename)
            
            # Step 3: Prepare image record with health assessment data
            image_record = {
                "plant_id": plant_id,
                "image_url": image_url
            }
            
            # Add health assessment data if provided
            if health_assessment and health_assessment.get("success"):
                image_record["health_status"] = health_assessment.get("overall_status", "unknown")
                image_record["health_score"] = health_assessment.get("health_score", 0)
                image_record["health_confidence"] = health_assessment.get("confidence", 0.0)
                # Store full assessment as JSONB
                image_record["health_assessment"] = health_assessment
            
            db_response = self.client.table(self.table).insert(image_record).execute()
            
            return {
                "success": True,
                "image_id": db_response.data[0]["id"] if db_response.data else None,
                "image_url": image_url,
                "plant_id": plant_id,
                "health_assessed": health_assessment is not None and health_assessment.get("success", False)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error uploading image: {str(e)}"
            }

