import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

class DatabaseHandler:
    """
    Uses the scientific name of the plant as the primary key.
    """

    def __init__(self):
        """
        Initialize the database handler.
        """
        self.supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

    # PLANTS TABLE - USED FOR GETTING PLANTS BY SCIENTIFIC NAME

    def get_plant_by_scientific_name(self, scientific_name: str) -> dict:
        """
        Get a plant by its scientific name.
        """
        response = self.supabase.table("plants").select("*").eq("scientific_name", scientific_name).execute()
        return response.data[0] if response.data else {}

    def get_all_plants_by_scientific_name(self) -> list[dict]:
        """
        Get all plants from the database by scientific name.
        """
        response = self.supabase.table("plants").select("*").order("scientific_name", desc=False).execute()
        return response.data if response.data else []

    # USER_PLANT_IMAGES TABLE - USED FOR ADDING AND GETTING ALL USER PLANT IMAGES BY SCIENTIFIC NAME

    def upload_user_plant_image(self, scientific_name: str, image: bytes) -> dict:
        """
        Upload a user's plant image to the database.
        """
        response = self.supabase.table("user_plant_images").insert({"scientific_name": scientific_name, "image": image}).execute()
        return response.data[0] if response.data else {}