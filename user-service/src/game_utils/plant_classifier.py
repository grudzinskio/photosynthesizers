

class PlantClassifier:
    def __init__(self):
        self.model = self._load_model()


    def classify_image(self, image: bytes) -> dict:
        """
        Classify an image of a plant.
        """
        try:
            plant_name = self.predict_image(image)
            return {
                "success": True,
                "plant_name": plant_name
            }
        except Exception as e:
            return {
                "success": False,
                "plant_name": None
            }

    def predict_image(self, image: bytes) -> str:
        """
        Predict the name of a plant from an image.
        """
        try:
            #TODO : Get model to classify the image
            return "plant_name"
        except Exception as e:
            print(f"Error predicting image: {str(e)}")
            return None

    def _load_model(self):
        """ Just load the file of the model."""
        pass