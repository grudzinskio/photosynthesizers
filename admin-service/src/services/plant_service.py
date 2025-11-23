"""
Plant service for managing plant data in Supabase.
Handles all CRUD operations for the plants table.
"""
from typing import List, Dict, Optional
from supabase_client import get_client, async_execute


class PlantService:
    """Service for plant-related database operations."""
    
    def __init__(self):
        """Initialize the plant service with Supabase client."""
        self.client = get_client()
        self.table = "plants"
    
    def get_plant_by_scientific_name(self, scientific_name: str) -> Optional[Dict]:
        """
        Get a plant by its scientific name.
        
        Args:
            scientific_name: Scientific name of the plant
            
        Returns:
            Plant dictionary or None if not found
        """
        response = self.client.table(self.table).select("*").eq("scientific_name", scientific_name).execute()
        return response.data[0] if response.data else None
    
    def get_all_plants_by_scientific_name(self) -> List[Dict]:
        """
        Get all plants from the database ordered by scientific name.
        
        Returns:
            List of plant dictionaries
        """
        response = self.client.table(self.table).select("*").order("scientific_name", desc=False).execute()
        return response.data if response.data else []
    
    def get_plant_by_id(self, plant_id: str) -> Optional[Dict]:
        """
        Get a plant by its ID.
        
        Args:
            plant_id: UUID of the plant
            
        Returns:
            Plant dictionary or None if not found
        """
        response = self.client.table(self.table).select("*").eq("id", plant_id).execute()
        return response.data[0] if response.data else None
    
    def get_plants_by_dome(self, dome: str) -> List[Dict]:
        """
        Get all plants in a specific dome.
        
        Args:
            dome: Name of the dome
            
        Returns:
            List of plant dictionaries
        """
        response = self.client.table(self.table).select("*").eq("dome", dome).execute()
        return response.data if response.data else []
    
    def get_all_plants(self) -> List[Dict]:
        """
        Get all plants from the database.
        
        Returns:
            List of plant dictionaries
        """
        response = self.client.table(self.table).select("*").execute()
        return response.data if response.data else []
    
    def save_plant(self, plant_data: Dict) -> Dict:
        """
        Save or update a plant in the database.
        Uses scientific_name and dome as unique identifier.
        
        Args:
            plant_data: Dictionary containing plant information with keys:
                - common_name
                - scientific_name (required)
                - qty
                - buy_new_wont_survive
                - buy_new_readily_available
                - move_it_staff_can_do
                - move_it_requires_consult
                - notes
                - display
                - stop
                - dome (required)
                - image_url (optional)
        
        Returns:
            Dictionary with saved plant data
        """
        # Normalize plant data (handle both Excel column names and direct field names)
        plant_record = {
            "common_name": plant_data.get("Common Name") or plant_data.get("common_name"),
            "scientific_name": plant_data.get("Scientific Name") or plant_data.get("scientific_name"),
            "qty": plant_data.get("Qty") or plant_data.get("qty"),
            "buy_new_wont_survive": bool(plant_data.get("Buy New - Won't Survive/Not Worth Moving") or plant_data.get("buy_new_wont_survive", False)),
            "buy_new_readily_available": bool(plant_data.get("Buy New - Readily Available") or plant_data.get("buy_new_readily_available", False)),
            "move_it_staff_can_do": bool(plant_data.get("Move It - Can be done by Domes staff") or plant_data.get("move_it_staff_can_do", False)),
            "move_it_requires_consult": bool(plant_data.get("Move It - Requires consult - might not survive move") or plant_data.get("move_it_requires_consult", False)),
            "notes": plant_data.get("Notes") or plant_data.get("notes") or "",
            "display": bool(plant_data.get("Display") or plant_data.get("display", False)),
            "stop": plant_data.get("Stop") or plant_data.get("stop") or "N/A",
            "dome": plant_data.get("Dome") or plant_data.get("dome"),
            "image_url": plant_data.get("image_url")
        }
        
        # Check if plant already exists
        existing = self.client.table(self.table).select("*").eq("scientific_name", plant_record["scientific_name"]).eq("dome", plant_record["dome"]).execute()
        
        if existing.data:
            # Update existing plant
            response = self.client.table(self.table).update(plant_record).eq("scientific_name", plant_record["scientific_name"]).eq("dome", plant_record["dome"]).execute()
        else:
            # Insert new plant
            response = self.client.table(self.table).insert(plant_record).execute()
        
        return response.data[0] if response.data else {}
    
    async def save_plants_batch_async(self, plants: List[Dict]) -> Dict:
        """
        Save multiple plants to the database in a batch (async version).
        Uses async_execute to avoid blocking the event loop.
        
        Args:
            plants: List of plant dictionaries
            
        Returns:
            Dictionary with success status and counts
        """
        saved_count = 0
        updated_count = 0
        errors = []
        total = len(plants)
        
        print(f"Processing {total} plants for database save (async)...")
        
        for idx, plant in enumerate(plants):
            try:
                # Log progress every 50 plants
                if (idx + 1) % 50 == 0 or (idx + 1) == total:
                    print(f"Progress: {idx + 1}/{total} plants processed...")
                
                scientific_name = plant.get("Scientific Name", "") or plant.get("scientific_name", "")
                dome = plant.get("Dome", "") or plant.get("dome", "")
                
                if not scientific_name or not dome:
                    errors.append(f"Plant missing scientific_name or dome: {plant.get('Scientific Name', 'Unknown')}")
                    continue
                
                # Check if plant exists (async)
                existing = await async_execute(
                    lambda: self.client.table(self.table)
                    .select("id")
                    .eq("scientific_name", scientific_name)
                    .eq("dome", dome)
                )
                
                # Store qty as text (can be values like "6+", "10+", etc.)
                qty_raw = plant.get("Qty") or plant.get("qty")
                qty = str(qty_raw).strip() if qty_raw is not None else None
                
                plant_record = {
                    "common_name": plant.get("Common Name") or plant.get("common_name"),
                    "scientific_name": scientific_name,
                    "qty": qty,
                    "buy_new_wont_survive": bool(plant.get("Buy New - Won't Survive/Not Worth Moving") or plant.get("buy_new_wont_survive", False)),
                    "buy_new_readily_available": bool(plant.get("Buy New - Readily Available") or plant.get("buy_new_readily_available", False)),
                    "move_it_staff_can_do": bool(plant.get("Move It - Can be done by Domes staff") or plant.get("move_it_staff_can_do", False)),
                    "move_it_requires_consult": bool(plant.get("Move It - Requires consult - might not survive move") or plant.get("move_it_requires_consult", False)),
                    "notes": plant.get("Notes") or plant.get("notes") or "",
                    "display": bool(plant.get("Display") or plant.get("display", False)),
                    "stop": plant.get("Stop") or plant.get("stop") or "N/A",
                    "dome": dome
                }
                
                if existing.data:
                    # Update existing plant (async)
                    await async_execute(
                        lambda: self.client.table(self.table)
                        .update(plant_record)
                        .eq("scientific_name", scientific_name)
                        .eq("dome", dome)
                    )
                    updated_count += 1
                else:
                    # Insert new plant (async)
                    await async_execute(
                        lambda: self.client.table(self.table)
                        .insert(plant_record)
                    )
                    saved_count += 1
            except Exception as e:
                error_msg = f"Error saving plant {plant.get('Scientific Name', 'Unknown')}: {str(e)}"
                errors.append(error_msg)
                # Only print first few errors to avoid spam
                if len(errors) <= 5:
                    print(f"  {error_msg}")
        
        print(f"Database save complete: {saved_count} saved, {updated_count} updated, {len(errors)} errors")
        
        return {
            "success": len(errors) == 0,
            "saved": saved_count,
            "updated": updated_count,
            "errors": errors
        }
    
    def save_plants_batch(self, plants: List[Dict]) -> Dict:
        """
        Save multiple plants to the database in a batch.
        
        Args:
            plants: List of plant dictionaries
            
        Returns:
            Dictionary with success status and counts
        """
        saved_count = 0
        updated_count = 0
        errors = []
        total = len(plants)
        
        print(f"Processing {total} plants for database save...")
        
        for idx, plant in enumerate(plants):
            try:
                # Log progress every 50 plants
                if (idx + 1) % 50 == 0 or (idx + 1) == total:
                    print(f"Progress: {idx + 1}/{total} plants processed...")
                
                scientific_name = plant.get("Scientific Name", "") or plant.get("scientific_name", "")
                dome = plant.get("Dome", "") or plant.get("dome", "")
                
                if not scientific_name or not dome:
                    errors.append(f"Plant missing scientific_name or dome: {plant.get('Scientific Name', 'Unknown')}")
                    continue
                
                # Check if plant exists
                existing = self.client.table(self.table).select("id").eq("scientific_name", scientific_name).eq("dome", dome).execute()
                
                # Store qty as text (can be values like "6+", "10+", etc.)
                qty_raw = plant.get("Qty") or plant.get("qty")
                qty = str(qty_raw).strip() if qty_raw is not None else None
                
                plant_record = {
                    "common_name": plant.get("Common Name") or plant.get("common_name"),
                    "scientific_name": scientific_name,
                    "qty": qty,
                    "buy_new_wont_survive": bool(plant.get("Buy New - Won't Survive/Not Worth Moving") or plant.get("buy_new_wont_survive", False)),
                    "buy_new_readily_available": bool(plant.get("Buy New - Readily Available") or plant.get("buy_new_readily_available", False)),
                    "move_it_staff_can_do": bool(plant.get("Move It - Can be done by Domes staff") or plant.get("move_it_staff_can_do", False)),
                    "move_it_requires_consult": bool(plant.get("Move It - Requires consult - might not survive move") or plant.get("move_it_requires_consult", False)),
                    "notes": plant.get("Notes") or plant.get("notes") or "",
                    "display": bool(plant.get("Display") or plant.get("display", False)),
                    "stop": plant.get("Stop") or plant.get("stop") or "N/A",
                    "dome": dome
                }
                
                if existing.data:
                    # Update existing plant
                    self.client.table(self.table).update(plant_record).eq("scientific_name", scientific_name).eq("dome", dome).execute()
                    updated_count += 1
                else:
                    # Insert new plant
                    self.client.table(self.table).insert(plant_record).execute()
                    saved_count += 1
            except Exception as e:
                error_msg = f"Error saving plant {plant.get('Scientific Name', 'Unknown')}: {str(e)}"
                errors.append(error_msg)
                # Only print first few errors to avoid spam
                if len(errors) <= 5:
                    print(f"  {error_msg}")
        
        print(f"Database save complete: {saved_count} saved, {updated_count} updated, {len(errors)} errors")
        
        return {
            "success": len(errors) == 0,
            "saved": saved_count,
            "updated": updated_count,
            "errors": errors
        }

