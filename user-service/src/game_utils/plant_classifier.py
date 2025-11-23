import open_clip
import torch
from PIL import Image
import io
from game_utils.database_handler import DatabaseHandler

class PlantClassifier:
    # Class-level cache to avoid reloading model for each instance
    _model = None
    _preprocess = None
    _tokenizer = None
    _device = None
    _text_features_cache = None
    _scientific_names_cache = None
    
    def __init__(self):
        """Initialize the classifier, loading model only once."""
        if PlantClassifier._model is None:
            self._load_model()
        
        self.model = PlantClassifier._model
        self.preprocess = PlantClassifier._preprocess
        self.tokenizer = PlantClassifier._tokenizer
        self.device = PlantClassifier._device

    def _load_model(self):
        """Load BioCLIP model and precompute text features from database."""
        print("Loading BioCLIP model...")
        
        # Setup device
        PlantClassifier._device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {PlantClassifier._device}")
        
        # Load BioCLIP
        model, _, preprocess_val = open_clip.create_model_and_transforms('hf-hub:imageomics/bioclip')
        tokenizer = open_clip.get_tokenizer('hf-hub:imageomics/bioclip')
        
        model = model.to(PlantClassifier._device)
        model.eval()
        
        # Enable FP16 for faster inference on GPU
        if PlantClassifier._device == "cuda":
            model = model.half()
        
        # Store in class variables
        PlantClassifier._model = model
        PlantClassifier._preprocess = preprocess_val
        PlantClassifier._tokenizer = tokenizer
        
        # Precompute text features from database
        self._precompute_text_features()
        
        print(f"BioCLIP model loaded! {len(PlantClassifier._scientific_names_cache)} plants indexed.")

    def _precompute_text_features(self):
        """Load plants from database and precompute their text embeddings."""
        print("Loading plants from database...")
        
        # Get all plants from database
        db_handler = DatabaseHandler()
        all_plants = db_handler.get_all_plants_by_scientific_name()
        
        # Extract scientific names
        PlantClassifier._scientific_names_cache = [
            plant["scientific_name"] for plant in all_plants
        ]
        
        print(f"Found {len(PlantClassifier._scientific_names_cache)} plants in database")
        
        # Tokenize all plant names
        text = PlantClassifier._tokenizer(PlantClassifier._scientific_names_cache).to(PlantClassifier._device)
        
        # Encode text features
        with torch.no_grad():
            text_features = PlantClassifier._model.encode_text(text)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            if PlantClassifier._device == "cuda":
                text_features = text_features.half()
            
            PlantClassifier._text_features_cache = text_features
        
        print("Text features precomputed and cached!")

    def classify_image(self, image: bytes) -> dict:
        """
        Classify an image of a plant.
        """
        try:
            print("Classifying image...")
            result = self.predict_image(image)
            return {
                "success": True,
                "plant_name": result["plant_name"],
                "confidence": result["confidence"],
                "top_5": result["top_5"]
            }
        except Exception as e:
            print(f"Error classifying image: {str(e)}")
            return {
                "success": False,
                "plant_name": None,
                "confidence": 0.0,
                "top_5": []
            }

    def predict_image(self, image: bytes) -> dict:
        """
        Predict the name of a plant from an image.
    
        """
        try:
            # Load image from bytes
            pil_image = Image.open(io.BytesIO(image)).convert('RGB')
            
            # Preprocess image
            image_tensor = self.preprocess(pil_image).unsqueeze(0).to(self.device)
            
            if self.device == "cuda":
                image_tensor = image_tensor.half()
            
            # Get image features
            with torch.no_grad():
                image_features = self.model.encode_image(image_tensor)
                image_features /= image_features.norm(dim=-1, keepdim=True)
                
                # Compare with cached text features
                similarity = (100.0 * image_features @ PlantClassifier._text_features_cache.T).softmax(dim=-1)
            
            # Get probabilities
            probs = similarity[0].cpu().float().numpy()
            
            # Get top prediction
            top_idx = probs.argmax()
            top_plant = PlantClassifier._scientific_names_cache[top_idx]
            top_confidence = float(probs[top_idx])
            
            # Get top 5 predictions
            top_5_indices = probs.argsort()[-5:][::-1]
            top_5 = [
                (PlantClassifier._scientific_names_cache[i], float(probs[i]))
                for i in top_5_indices
            ]
            
            return {
                "plant_name": top_plant,
                "confidence": top_confidence,
                "top_5": top_5
            }
            
        except Exception as e:
            print(f"Error predicting image: {str(e)}")
            raise