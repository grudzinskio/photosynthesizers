"""
Image service for managing plant images in Supabase.
Note: Image uploads are handled by the user-service, but this service
provides methods to interact with the user_plant_images table.
"""
from typing import List, Dict, Optional
from supabase_client import get_client


class ImageService:
    """Service for image-related database operations."""
    
    def __init__(self):
        """Initialize the image service with Supabase client."""
        self.client = get_client()
        self.table = "user_plant_images"
    
    def get_recent_images(self, limit: int = 50) -> List[Dict]:
        """
        Get recent images uploaded by users, ordered by uploaded_at descending.
        Includes plant information via join.
        
        Args:
            limit: Maximum number of images to return
            
        Returns:
            List of image dictionaries with plant information
        """
        response = (
            self.client.table(self.table)
            .select("*, plants(*)")
            .order("uploaded_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data if response.data else []
    
    def get_images_by_plant_id(self, plant_id: str) -> List[Dict]:
        """
        Get all images for a specific plant.
        
        Args:
            plant_id: UUID of the plant
            
        Returns:
            List of image dictionaries
        """
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("plant_id", plant_id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        return response.data if response.data else []
    

