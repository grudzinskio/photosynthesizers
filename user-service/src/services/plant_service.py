"""
Plant service for managing plant data in Supabase.
Handles all CRUD operations for the plants table.
"""
from typing import List, Dict, Optional
from supabase_client import get_client


class PlantService:
    """Service for plant-related database operations."""
    
    def __init__(self):
        """Initialize the plant service with Supabase client."""
        self.client = get_client()
        self.table = "plants"
    
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
        query = self.client.table(self.table).select("*").eq("scientific_name", scientific_name)
        if dome:
            query = query.eq("dome", dome)
        
        response = query.execute()
        return response.data[0] if response.data else None
    
    def get_all_plants_by_scientific_name(self) -> List[Dict]:
        """
        Get all plants from the database ordered by scientific name.
        
        Returns:
            List of plant dictionaries
        """
        response = self.client.table(self.table).select("*").order("scientific_name", desc=False).execute()
        return response.data if response.data else []
    
    def get_plant_id_by_scientific_name_and_dome(self, scientific_name: str, dome: str) -> Optional[str]:
        """
        Get plant ID by scientific name and dome.
        Tries exact match first, then case-insensitive match.
        
        Args:
            scientific_name: Scientific name of the plant
            dome: Dome name
            
        Returns:
            Plant ID (UUID) or None if not found
        """
        # First try exact match
        response = (
            self.client.table(self.table)
            .select("id, dome")
            .eq("scientific_name", scientific_name)
            .eq("dome", dome)
            .limit(1)
            .execute()
        )
        
        if response.data:
            return response.data[0]["id"]
        
        # If exact match fails, try case-insensitive by getting all matches and filtering
        response = (
            self.client.table(self.table)
            .select("id, dome")
            .eq("scientific_name", scientific_name)
            .execute()
        )
        
        if response.data:
            # Case-insensitive match
            dome_lower = dome.lower().strip()
            for plant in response.data:
                if plant.get("dome", "").lower().strip() == dome_lower:
                    return plant["id"]
        
        return None

