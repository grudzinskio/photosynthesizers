import random
from game_utils.plant_summarizer import PlantSummarizer
from game_utils.plant_classifier import PlantClassifier

class PlantGame:
    """
    This class is used to manage the plant game.
    """

    def __init__(self):
        self.all_plants = load_plants()
        self.current_plant = None
        self.summarizer = PlantSummarizer()
        self.plant_classifier = PlantClassifier()


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

    def load_plants(self) -> list[str]:
        """
        Load the names of the plants from the database.
        Will be replaced with a database in the future.
        """
        return ["Plant 1", "Plant 2", "Plant 3"]

    def verify_and_process(self, plant_id, image, filename):
        return {}

    def summarize_plant(self, plant_name):
        """
        Summarize a plant based on its name.
        """
        print(f"Summarizing plant: {plant_name}")
        summary = self.summarizer.summarize(plant_name)
        print(f"Summary: {summary}")
        return {}

    def answer_plant_question(self, question):
        """
        Answer a question about a plant.
        """
        answer = self.summarizer.follow_up_question(question)
        print(f"Answering question: {question}")
        return {
            "answer": answer,
            "success": True
        }