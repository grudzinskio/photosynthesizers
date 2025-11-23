"""
Plant service for managing plant data in Supabase.
Handles all CRUD operations for the plants table.
"""
from typing import List, Dict, Optional, Any
import math
from supabase_client import get_client, async_execute


def clean_nan_values(value: Any) -> Any:
    """
    Clean NaN values from data to make it JSON-compliant.
    Converts NaN, None, and 'nan' strings to appropriate defaults.
    """
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if isinstance(value, str):
        if value.lower() == 'nan' or value.strip() == '':
            return None
    return value

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
    
    def get_all_domes(self) -> List[str]:
        """
        Get list of all unique dome names from the database.
        This is optimized to only fetch the dome column.
        
        Returns:
            List of unique dome names, sorted
        """
        try:
            response = self.client.table(self.table).select("dome").execute()
            domes = list(set(plant.get("dome") for plant in (response.data or []) if plant.get("dome")))
            domes.sort()
            return domes
        except Exception:
            return []
    
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
        Get all plants in a specific dome with image counts.
        
        Args:
            dome: Name of the dome
            
        Returns:
            List of plant dictionaries with image_count field
        """
        response = self.client.table(self.table).select("*").eq("dome", dome).execute()
        plants = response.data if response.data else []
        
        # Get all image counts in a single query
        image_counts = self._get_all_image_counts([plant.get("id") for plant in plants if plant.get("id")])
        
        # Add image counts to plants
        for plant in plants:
            plant_id = plant.get("id")
            plant["image_count"] = image_counts.get(plant_id, 0) if plant_id else 0
        
        return plants
    
    def get_all_plants(self) -> List[Dict]:
        """
        Get all plants from the database with image counts.
        
        Returns:
            List of plant dictionaries with image_count field
        """
        response = self.client.table(self.table).select("*").execute()
        plants = response.data if response.data else []
        
        # Get all image counts in a single query
        plant_ids = [plant.get("id") for plant in plants if plant.get("id")]
        image_counts = self._get_all_image_counts(plant_ids)
        
        # Add image counts to plants
        for plant in plants:
            plant_id = plant.get("id")
            plant["image_count"] = image_counts.get(plant_id, 0) if plant_id else 0
        
        return plants
    
    def _get_image_count(self, plant_id: str) -> int:
        """
        Get the count of images for a specific plant.
        
        Args:
            plant_id: UUID of the plant
            
        Returns:
            Number of images for the plant
        """
        try:
            response = self.client.table("user_plant_images").select("id", count="exact").eq("plant_id", plant_id).execute()
            return response.count if response.count is not None else 0
        except Exception:
            return 0
    
    def _get_all_image_counts(self, plant_ids: List[str]) -> Dict[str, int]:
        """
        Get image counts for multiple plants in a single query.
        This is much more efficient than calling _get_image_count for each plant.
        
        Args:
            plant_ids: List of plant UUIDs
            
        Returns:
            Dictionary mapping plant_id to image count
        """
        if not plant_ids:
            return {}
        
        try:
            # Supabase has a limit on the number of items in .in_() queries
            # Process in batches of 100 to avoid hitting limits
            batch_size = 100
            image_counts: Dict[str, int] = {plant_id: 0 for plant_id in plant_ids}
            
            for i in range(0, len(plant_ids), batch_size):
                batch_ids = plant_ids[i:i + batch_size]
                try:
                    # Fetch all images for this batch of plants
                    response = self.client.table("user_plant_images").select("plant_id").in_("plant_id", batch_ids).execute()
                    
                    # Count images per plant
                    if response.data:
                        for image in response.data:
                            plant_id = image.get("plant_id")
                            if plant_id and plant_id in image_counts:
                                image_counts[plant_id] = image_counts.get(plant_id, 0) + 1
                except Exception as batch_error:
                    # If batch fails, log but continue with other batches
                    print(f"Error fetching image counts for batch {i//batch_size + 1}: {str(batch_error)}")
                    # Continue with next batch
            
            return image_counts
        except Exception as e:
            # If query fails completely, return zeros for all plants
            print(f"Error fetching image counts: {str(e)}")
            return {plant_id: 0 for plant_id in plant_ids}
    
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
        Uses batch operations for much better performance.
        Matches plants by common_name + scientific_name pair.
        
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
        
        # Step 1: Clean and normalize all plant data
        normalized_plants = []
        for plant in plants:
            try:
                # Clean NaN values from plant data
                scientific_name_raw = clean_nan_values(plant.get("Scientific Name")) or clean_nan_values(plant.get("scientific_name"))
                scientific_name = str(scientific_name_raw).strip() if scientific_name_raw else ""
                dome_raw = clean_nan_values(plant.get("Dome")) or clean_nan_values(plant.get("dome"))
                dome = str(dome_raw).strip() if dome_raw else ""
                
                if not scientific_name or not dome:
                    errors.append(f"Plant missing scientific_name or dome: {plant.get('Scientific Name', 'Unknown')}")
                    continue
                
                # Store qty as text (can be values like "6+", "10+", etc.)
                qty_raw = clean_nan_values(plant.get("Qty")) or clean_nan_values(plant.get("qty"))
                qty = str(qty_raw).strip() if qty_raw is not None and str(qty_raw).lower() != 'nan' else None
                
                # Clean all values before creating plant_record
                common_name_raw = clean_nan_values(plant.get("Common Name")) or clean_nan_values(plant.get("common_name"))
                common_name = str(common_name_raw).strip() if common_name_raw and str(common_name_raw).lower() != 'nan' else None
                
                notes_raw = clean_nan_values(plant.get("Notes")) or clean_nan_values(plant.get("notes"))
                notes = str(notes_raw).strip() if notes_raw and str(notes_raw).lower() != 'nan' else ""
                
                stop_raw = clean_nan_values(plant.get("Stop")) or clean_nan_values(plant.get("stop"))
                stop = str(stop_raw).strip() if stop_raw and str(stop_raw).lower() != 'nan' else "N/A"
                
                plant_record = {
                    "common_name": common_name,
                    "scientific_name": scientific_name,
                    "qty": qty,
                    "buy_new_wont_survive": bool(plant.get("Buy New - Won't Survive/Not Worth Moving") or plant.get("buy_new_wont_survive", False)),
                    "buy_new_readily_available": bool(plant.get("Buy New - Readily Available") or plant.get("buy_new_readily_available", False)),
                    "move_it_staff_can_do": bool(plant.get("Move It - Can be done by Domes staff") or plant.get("move_it_staff_can_do", False)),
                    "move_it_requires_consult": bool(plant.get("Move It - Requires consult - might not survive move") or plant.get("move_it_requires_consult", False)),
                    "notes": notes,
                    "display": bool(plant.get("Display") or plant.get("display", False)),
                    "stop": stop,
                    "dome": dome
                }
                
                normalized_plants.append({
                    "record": plant_record,
                    "key": (common_name or "", scientific_name, dome)  # Match on common_name + scientific_name + dome
                })
            except Exception as e:
                error_msg = f"Error processing plant {plant.get('Scientific Name', 'Unknown')}: {str(e)}"
                errors.append(error_msg)
                if len(errors) <= 10:
                    print(f"  {error_msg}")
        
        if not normalized_plants:
            return {
                "success": False,
                "saved": 0,
                "updated": 0,
                "errors": errors
            }
        
        print(f"Normalized {len(normalized_plants)} plants, fetching existing plants...")
        
        # Step 2: Fetch all existing plants in one query (batch)
        try:
            all_existing = await async_execute(
                lambda: self.client.table(self.table)
                .select("id, common_name, scientific_name, dome")
            )
            
            # Create lookup map: (common_name, scientific_name, dome) -> id
            # This allows multiple records with same scientific_name in same dome if common_name differs
            existing_map = {}
            for existing in (all_existing.data or []):
                key = (
                    existing.get("common_name") or "", 
                    existing.get("scientific_name") or "",
                    existing.get("dome") or ""
                )
                existing_map[key] = existing.get("id")
            
            print(f"Found {len(existing_map)} existing plants in database")
            
        except Exception as e:
            error_msg = f"Error fetching existing plants: {str(e)}"
            errors.append(error_msg)
            print(f"  {error_msg}")
            return {
                "success": False,
                "saved": 0,
                "updated": 0,
                "errors": errors
            }
        
        # Step 3: Separate into inserts and updates
        plants_to_insert = []
        plants_to_update = []
        
        for item in normalized_plants:
            plant_record = item["record"]
            key = item["key"]
            
            if key in existing_map:
                # Add id for update
                plant_record["id"] = existing_map[key]
                plants_to_update.append(plant_record)
            else:
                plants_to_insert.append(plant_record)
        
        print(f"  {len(plants_to_insert)} new plants to insert")
        print(f"  {len(plants_to_update)} existing plants to update")
        
        # Step 4: Batch insert/upsert all new plants
        # Use upsert to handle duplicates gracefully (will update if (scientific_name, dome) exists)
        if plants_to_insert:
            try:
                # Process in batches of 100 to avoid payload size limits
                batch_size = 100
                for i in range(0, len(plants_to_insert), batch_size):
                    batch = plants_to_insert[i:i + batch_size]
                    # Insert all plants - no unique constraint, so duplicates are allowed
                    # We'll match and update existing records based on (common_name, scientific_name, dome)
                    # but also allow new identical records to be inserted
                    await async_execute(
                        lambda b=batch: self.client.table(self.table).insert(b)
                    )
                    saved_count += len(batch)
                    if (i + batch_size) % 200 == 0 or i + batch_size >= len(plants_to_insert):
                        print(f"  Upserted {min(i + batch_size, len(plants_to_insert))}/{len(plants_to_insert)} new plants...")
            except Exception as e:
                error_msg = f"Error batch upserting plants: {str(e)}"
                errors.append(error_msg)
                print(f"  {error_msg}")
                # If batch upsert fails, try individual upserts to identify problematic records
                if len(plants_to_insert) > 0:
                    print(f"  Attempting individual upserts for remaining plants...")
                    for plant in plants_to_insert[i:]:
                        try:
                            await async_execute(
                                lambda p=plant: self.client.table(self.table).insert(p)
                            )
                            saved_count += 1
                        except Exception as individual_error:
                            errors.append(f"Error upserting plant {plant.get('scientific_name', 'Unknown')}: {str(individual_error)}")
                            if len(errors) <= 15:
                                print(f"    Individual error: {plant.get('scientific_name', 'Unknown')}")
        
        # Step 5: Batch update existing plants
        if plants_to_update:
            try:
                # Update in batches of 100
                batch_size = 100
                for i in range(0, len(plants_to_update), batch_size):
                    batch = plants_to_update[i:i + batch_size]
                    # Supabase doesn't support batch update directly, so we use upsert
                    # Upsert will update if exists (by id) or insert if not
                    await async_execute(
                        lambda b=batch: self.client.table(self.table).upsert(b)
                    )
                    updated_count += len(batch)
                    if (i + batch_size) % 200 == 0 or i + batch_size >= len(plants_to_update):
                        print(f"  Updated {min(i + batch_size, len(plants_to_update))}/{len(plants_to_update)} existing plants...")
            except Exception as e:
                error_msg = f"Error batch updating plants: {str(e)}"
                errors.append(error_msg)
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
                
                # Clean NaN values from plant data
                scientific_name_raw = clean_nan_values(plant.get("Scientific Name")) or clean_nan_values(plant.get("scientific_name"))
                scientific_name = str(scientific_name_raw).strip() if scientific_name_raw else ""
                dome_raw = clean_nan_values(plant.get("Dome")) or clean_nan_values(plant.get("dome"))
                dome = str(dome_raw).strip() if dome_raw else ""
                
                if not scientific_name or not dome:
                    errors.append(f"Plant missing scientific_name or dome: {plant.get('Scientific Name', 'Unknown')}")
                    continue
                
                # Check if plant exists
                existing = self.client.table(self.table).select("id").eq("scientific_name", scientific_name).eq("dome", dome).execute()
                
                # Store qty as text (can be values like "6+", "10+", etc.)
                qty_raw = clean_nan_values(plant.get("Qty")) or clean_nan_values(plant.get("qty"))
                qty = str(qty_raw).strip() if qty_raw is not None and str(qty_raw).lower() != 'nan' else None
                
                # Clean all values before creating plant_record
                common_name_raw = clean_nan_values(plant.get("Common Name")) or clean_nan_values(plant.get("common_name"))
                common_name = str(common_name_raw).strip() if common_name_raw and str(common_name_raw).lower() != 'nan' else None
                
                notes_raw = clean_nan_values(plant.get("Notes")) or clean_nan_values(plant.get("notes"))
                notes = str(notes_raw).strip() if notes_raw and str(notes_raw).lower() != 'nan' else ""
                
                stop_raw = clean_nan_values(plant.get("Stop")) or clean_nan_values(plant.get("stop"))
                stop = str(stop_raw).strip() if stop_raw and str(stop_raw).lower() != 'nan' else "N/A"
                
                plant_record = {
                    "common_name": common_name,
                    "scientific_name": scientific_name,
                    "qty": qty,
                    "buy_new_wont_survive": bool(plant.get("Buy New - Won't Survive/Not Worth Moving") or plant.get("buy_new_wont_survive", False)),
                    "buy_new_readily_available": bool(plant.get("Buy New - Readily Available") or plant.get("buy_new_readily_available", False)),
                    "move_it_staff_can_do": bool(plant.get("Move It - Can be done by Domes staff") or plant.get("move_it_staff_can_do", False)),
                    "move_it_requires_consult": bool(plant.get("Move It - Requires consult - might not survive move") or plant.get("move_it_requires_consult", False)),
                    "notes": notes,
                    "display": bool(plant.get("Display") or plant.get("display", False)),
                    "stop": stop,
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
                # Print first 10 errors to help debug
                if len(errors) <= 10:
                    print(f"  {error_msg}")
        
        print(f"Database save complete: {saved_count} saved, {updated_count} updated, {len(errors)} errors")
        
        return {
            "success": len(errors) == 0,
            "saved": saved_count,
            "updated": updated_count,
            "errors": errors
        }

