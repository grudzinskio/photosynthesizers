import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

class DatabaseHandler:
    def __init__(self):
        self.supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

    """
    PLANTS TABLE
    USED FOR GETTING PLANTS BY SCIENTIFIC NAME
    """

    def get_plant_by_scientific_name(self, scientific_name: str) -> dict:
        """
        Get a plant by its scientific name.
        """
        response = self.supabase.from("plants").select("*").eq("scientific_name", scientific_name).execute()
        return response.data[0] if response.data else {}

    def get_all_plants_by_scientific_name(self) -> list[dict]:
        """
        Get all plants from the database by scientific name.
        """
        response = self.supabase.from("plants").select("*").order("scientific_name", ascending=True).execute()
        return response.data if response.data else []


    """
    PLANT_IMAGES TABLE
    USED FOR ADDING AND GETTING PLANT IMAGES
    """

    def add_plant_image(self, scientific_name: str, image: bytes) -> dict:
        """
        Update the image of a plant by its scientific name.
        """
        response = self.supabase.from("plants").update({"image": image}).eq("scientific_name", scientific_name).execute()
        return response.data[0] if response.data else {}