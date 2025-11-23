import random
from game_utils.supabase_handler import SupabaseHandler
from game_utils.plant_summarizer import PlantSummarizer
from game_utils.plant_classifier import PlantClassifier


_plant_classifier = None

def get_plant_classifier():
    """Get the shared PlantClassifier instance"""
    global _plant_classifier
    if _plant_classifier is None:
        _plant_classifier = PlantClassifier()
    return _plant_classifier


class PlantGame:
    """
    This class is used to manage the plant game.
    """

    def __init__(self, dome_type: str, plant_name: str = None):
        self.dome_type = dome_type
        self.current_plant = plant_name

        self.supabase_handler = None # used to get the plants from the database and upload user images
        self.plant_classifier = None # used to classify the user's image 
        self.plant_summarizer = None # used to summarize the plant


    def get_random_plant(self) -> str:
        """
        Get a random plant from the list of all plants.
        Set the current plant to the random plant.

        Get the plants from the database that are in the dome type.

        Return the random plant name to the user.
        """
        self.supabase_handler = SupabaseHandler()
        dome_plants = self._load_plants_in_dome()
        self.current_plant = random.choice(dome_plants)
        print(f"Random plant: {self.current_plant}")
        return self.current_plant

    def _load_plants_in_dome(self) -> list[str]:
        """
        Load the plants from the database that are in the dome type.
        """
        all_plants = self.supabase_handler.get_all_plants_by_scientific_name()

        dome_plants = [plant["scientific_name"] for plant in all_plants if plant.get("dome") == self.dome_type]
        return dome_plants


    def verify_and_upload_image(self, image: bytes) -> dict:
        """
        Verify an image and upload it to the database.
        Always uploads the image regardless of classification match.
        """
        try:
            plant_classifier = get_plant_classifier() # load the global plant classifier
            result = plant_classifier.classify_image(image)
            if not result.get("success"):
                return {
                    "success": False,
                    "message": "Failed to classify image"
                }
            
            # Always upload the image
            self.supabase_handler = SupabaseHandler()
            upload_result = self.supabase_handler.upload_user_plant_image(
                scientific_name=self.current_plant,
                dome=self.dome_type,
                image=image
            )
            
            if not upload_result.get("success"):
                return {
                    "success": False,
                    "message": upload_result.get("error", "Failed to upload image")
                }
            
            # Check if the image matches the user's current_plant
            if result.get("plant_name") != self.current_plant:
                return {
                    "success": False,
                    "message": "Oops! The image does not match the plant! Try again. (Image was uploaded)"
                }
            else:
                return {
                    "success": True,
                    "message": "Image verified and uploaded successfully"
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error verifying and uploading image: {str(e)}"
            }


    def summarize_plant(self):
        """
        Summarize a plant based on its name.
        If no plant_name is provided, use the current plant.
        """
        self.plant_summarizer = PlantSummarizer()
        # Use current plant if no plant name provided
        target_plant = self.current_plant
        
        if not target_plant:
            return {
                "success": False,
                "error": "No plant to summarize"
            }
        
        print(f"Summarizing plant: {target_plant}")
        summary = self.plant_summarizer.summarize(target_plant)
        print(f"Summary: {summary}")
        
        return {
            "plant_name": target_plant,
            "summary": summary,
            "success": True
        }

    def answer_plant_question(self, question):
        """
        Answer a question about the current plant.
        """
        if not self.current_plant:
            return {
                "success": False,
                "error": "No current plant to ask about"
            }
        
        print(f"Answering question about {self.current_plant}: {question}")
        answer = self.plant_summarizer.follow_up_question(self.current_plant, question)
        
        return {
            "plant_name": self.current_plant,
            "question": question,
            "answer": answer,
            "success": True
        }
