import random
import traceback
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
        self.current_plant = "Adiantum peruvianum"
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
        Verify an image by classifying it and checking if it matches the target plant.
        Only uploads the image to the database if the classification matches the target plant.
        
        Args:
            image: The image bytes to classify and potentially upload
            
        Returns:
            dict: Contains success status, message, classified_plant, confidence, and target_plant.
                  On successful upload, also includes image_url.
        """
        try:
            # Log the target plant at the start
            print(f"Classifying image for target plant: {self.current_plant}")
            
            # Step 1: Classify the image
            plant_classifier = get_plant_classifier()
            result = plant_classifier.classify_image(image)
            
            if not result.get("success"):
                error_msg = result.get("error", "Unknown classification error")
                print(f"Classification failed: {error_msg}")
                print("Upload skipped")
                return {
                    "success": False,
                    "message": "Failed to classify image. Please try again with a clearer photo.",
                    "classified_plant": None,
                    "confidence": 0.0,
                    "target_plant": self.current_plant
                }
            
            # Extract classification details
            classified_plant = result.get("plant_name")
            confidence = result.get("confidence", 0.0)
            
            # Log classification result
            print(f"Classification result: {classified_plant} (confidence: {confidence:.2%})")
            
            # Step 2: Check if classification matches target plant
            if classified_plant != self.current_plant:
                print("Match status: MISMATCH")
                print("Upload skipped")
                return {
                    "success": False,
                    "message": f"The image appears to be {classified_plant} (confidence: {confidence:.1%}), but you're looking for {self.current_plant}. Try again!",
                    "classified_plant": classified_plant,
                    "confidence": confidence,
                    "target_plant": self.current_plant
                }
            
            # Step 3: Upload image only if match is successful
            print("Match status: SUCCESS")
            print("Upload initiated")
            
            self.supabase_handler = SupabaseHandler()
            upload_result = self.supabase_handler.upload_user_plant_image(
                scientific_name=self.current_plant,
                dome=self.dome_type,
                image=image
            )
            
            # Log the upload result for debugging
            print(f"Upload result: {upload_result}")
            
            if not upload_result.get("success"):
                error_msg = upload_result.get('error', 'Unknown error')
                print(f"Upload failed: {error_msg}")
                return {
                    "success": False,
                    "message": f"Image matched but upload failed: {error_msg}",
                    "classified_plant": classified_plant,
                    "confidence": confidence,
                    "target_plant": self.current_plant
                }
            
            # Step 4: Return success with upload confirmation
            target_plant_display = self.current_plant.rstrip("? ").strip() if self.current_plant else None
            return {
                "success": True,
                "message": f"Success! Your {target_plant_display} image has been verified and uploaded.",
                "classified_plant": classified_plant,
                "confidence": confidence,
                "target_plant": self.current_plant,
                "image_url": upload_result.get("image_url")
            }
            
        except Exception as e:
            # Log full error details including traceback
            print(f"Exception during verification: {str(e)}")
            print(f"Full traceback:\n{traceback.format_exc()}")
            return {
                "success": False,
                "message": f"Error verifying image: {str(e)}",
                "classified_plant": None,
                "confidence": 0.0,
                "target_plant": self.current_plant
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
