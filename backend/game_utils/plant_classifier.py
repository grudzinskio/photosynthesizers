

class PlantClassifier:
    def __init__(self):
        self.model = load_model()


    def predict(self, image):
        return self.model.predict(image)


    def load_model(self):
        """ Jsut load the file of the model."""
        pass