import random
from game_utils.database_handler import DatabaseHandler
from game_utils.plant_summarizer import PlantSummarizer
from game_utils.plant_classifier import PlantClassifier

class PlantGame:
    """
    This class is used to manage the plant game.
    """

    def __init__(self, dome_type: str):
        self.dome_type = dome_type
        self.database_handler = DatabaseHandler()
        self.all_plants = self.load_plant_scientific_names()
        self.current_plant = None
        self.summarizer = PlantSummarizer()
        self.plant_classifier = PlantClassifier()

    def load_plant_scientific_names(self) -> list[str]:
        """
        Load the names of the plants from the database.
        """
        return [plant["scientific_name"] for plant in self.database_handler.get_all_plants_by_scientific_name()]

    def get_random_plant(self) -> str:
        """
        Get a random plant from the list of all plants.
        Set the current plant to the random plant.
        Return the random plant name to the user.
        """
        plant = random.choice(self.all_plants)
        print(f"Random plant: {plant}")
        self.current_plant = plant
        return plant


    def verify_and_upload_image(self, image):
        """
        Verify an image and upload it to the database.
        """
        try:
            # Verify the image
            result = self.plant_classifier.classify_image(image)
            if not result.get("success"):
                return {
                    "success": False,
                    "message": "Failed to classify image"
                }
            # Does the image match the user's current_plant?
            if result.get("plant_name") != self.current_plant:
                return {
                    "success": False,
                    "message": "Oops! The image does not match the plant"
                }
        
            # Upload the user's image to the user_plant_images table in the database
            self.database_handler.upload_user_plant_image(self.current_plant, image)
            return {
                "success": True,
                "message": "Image verified and uploaded successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error verifying and uploading image: {str(e)}"
            }

    def summarize_plant(self, plant_name=None):
        """
        Summarize a plant based on its name.
        If no plant_name is provided, use the current plant.
        """
        # Use current plant if no plant name provided
        target_plant = plant_name or self.current_plant
        
        if not target_plant:
            return {
                "success": False,
                "error": "No plant to summarize"
            }
        
        print(f"Summarizing plant: {target_plant}")
        summary = self.summarizer.summarize(target_plant)
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
        answer = self.summarizer.follow_up_question(self.current_plant, question)
        
        return {
            "plant_name": self.current_plant,
            "question": question,
            "answer": answer,
            "success": True
        }