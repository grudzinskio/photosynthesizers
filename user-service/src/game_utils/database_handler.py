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
        self.supabase = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY"))

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
    MAIN_PLANT_IMAGES TABLE
    USED FOR ADDING AND GETTING PLANT IMAGES
    """

    def set_main_plant_image(self, scientific_name: str, image: bytes) -> dict:
        """
        Update the image of a plant by its scientific name.
        """
        response = self.supabase.from("plants").update({"image": image}).eq("scientific_name", scientific_name).execute()
        return response.data[0] if response.data else {}

    def get_main_plant_image(self, scientific_name: str) -> bytes:
        """
        Get the image of a plant by its scientific name.
        """
        response = self.supabase.from("plants").select("image").eq("scientific_name", scientific_name).execute()
        return response.data[0]["image"] if response.data else None

    """
    USER_PLANT_IMAGES TABLE
    USED FOR ADDING AND GETTING ALL USER PLANT IMAGES BY SCIENTIFIC NAME
    """

    def upload_user_plant_image(self, scientific_name: str, image: bytes) -> dict:
        """
        Upload a user's plant image to the database.
        """
        response = self.supabase.from("user_plant_images").insert({"scientific_name": scientific_name, "image": image}).execute()
        return response.data[0] if response.data else {}

    def get_all_user_plant_images(self, scientific_name: str) -> bytes:
        """
        Get all user's plant images by its scientific name.
        """
        response = self.supabase.from("user_plant_images").select("image").eq("scientific_name", scientific_name).execute()
        return response.data if response.data else []