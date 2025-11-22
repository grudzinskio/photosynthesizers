import random
from game_utils.database_handler import DatabaseHandler
from game_utils.plant_summarizer import PlantSummarizer
from game_utils.plant_classifier import PlantClassifier

class PlantGame:
    """
    This class is used to manage the plant game.
    """

    def __init__(self):
        self.database_handler = DatabaseHandler()
        self.all_plants = self.database_handler.get_all_plants()
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


    def verify_and_process(self, plant_id, image, filename):
        return {}

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