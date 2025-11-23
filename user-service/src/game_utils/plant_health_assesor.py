"""
Plant health assessment module using BioCLIP's zero-shot classification.
Analyzes plant images to determine health status using visual-text matching.
"""
import open_clip
import torch
from PIL import Image
import io
from typing import Dict, List, Tuple


# Module-level singleton instance
_plant_health_assessor = None


def get_plant_health_assessor():
    """Get the shared PlantHealthAssessor instance (singleton pattern)."""
    global _plant_health_assessor
    if _plant_health_assessor is None:
        _plant_health_assessor = PlantHealthAssessor()
    return _plant_health_assessor


class PlantHealthAssessor:
    """Assess plant health using BioCLIP's zero-shot classification capabilities."""
    
    # Class-level cache to share model with PlantClassifier
    _model = None
    _preprocess = None
    _tokenizer = None
    _device = None
    
    # Health status categories with detailed descriptions
    HEALTH_CATEGORIES = {
        "healthy": [
            "a healthy vibrant plant with lush green leaves",
            "a thriving plant with strong growth and good color",
            "a plant in excellent condition with no visible problems"
        ],
        "minor_stress": [
            "a plant with slight yellowing on lower leaves",
            "a plant with minor leaf browning at tips",
            "a plant showing early signs of stress"
        ],
        "moderate_issues": [
            "a plant with yellowing leaves and some wilting",
            "a plant with visible leaf damage and discoloration",
            "a plant showing nutrient deficiency symptoms"
        ],
        "severe_issues": [
            "a sick plant with extensive brown spots and wilting",
            "a dying plant with severe leaf damage",
            "a plant with critical health problems and widespread decay"
        ]
    }
    
    # Specific issue categories
    ISSUE_CATEGORIES = {
        "pest_damage": [
            "a plant with insect damage and holes in leaves",
            "a plant infested with pests or bugs",
            "a plant with visible pest activity"
        ],
        "disease": [
            "a plant with fungal disease showing white powder",
            "a plant with bacterial spots and lesions",
            "a plant with mold or mildew growth"
        ],
        "water_stress": [
            "an overwatered plant with yellowing and drooping leaves",
            "an underwatered plant with wilting and dry leaves",
            "a plant showing signs of water stress"
        ],
        "nutrient_deficiency": [
            "a plant with chlorosis and pale yellow leaves",
            "a plant with purple or reddish leaf discoloration",
            "a plant showing signs of nutrient deficiency"
        ]
    }
    
    def __init__(self):
        """Initialize the health assessor, sharing model with PlantClassifier if possible."""
        if PlantHealthAssessor._model is None:
            self._load_model()
        
        self.model = PlantHealthAssessor._model
        self.preprocess = PlantHealthAssessor._preprocess
        self.tokenizer = PlantHealthAssessor._tokenizer
        self.device = PlantHealthAssessor._device
    
    def _load_model(self):
        """Load BioCLIP model, sharing with PlantClassifier if already loaded."""
        # Try to share model with PlantClassifier if it's already loaded
        try:
            from game_utils.plant_classifier import PlantClassifier
            if PlantClassifier._model is not None:
                print("Sharing BioCLIP model with PlantClassifier (already loaded)...")
                PlantHealthAssessor._model = PlantClassifier._model
                PlantHealthAssessor._preprocess = PlantClassifier._preprocess
                PlantHealthAssessor._tokenizer = PlantClassifier._tokenizer
                PlantHealthAssessor._device = PlantClassifier._device
                print("BioCLIP model shared successfully!")
                return
        except (ImportError, AttributeError):
            # PlantClassifier not available or not loaded yet, continue with own load
            pass
        
        # Load BioCLIP model if not sharing
        print("Loading BioCLIP model for health assessment...")
        
        # Setup device
        PlantHealthAssessor._device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {PlantHealthAssessor._device}")
        
        # Load BioCLIP
        model, _, preprocess_val = open_clip.create_model_and_transforms('hf-hub:imageomics/bioclip')
        tokenizer = open_clip.get_tokenizer('hf-hub:imageomics/bioclip')
        
        model = model.to(PlantHealthAssessor._device)
        model.eval()
        
        # Enable FP16 for faster inference on GPU
        if PlantHealthAssessor._device == "cuda":
            model = model.half()
        
        # Store in class variables
        PlantHealthAssessor._model = model
        PlantHealthAssessor._preprocess = preprocess_val
        PlantHealthAssessor._tokenizer = tokenizer
        
        print("BioCLIP model loaded for health assessment!")
    
    def _classify_image_with_texts(self, image: bytes, text_descriptions: List[str]) -> List[Tuple[str, float]]:
        """
        Classify an image against a list of text descriptions.
        
        Args:
            image: Image bytes
            text_descriptions: List of text descriptions to match against
            
        Returns:
            List of (description, probability) tuples sorted by probability
        """
        try:
            # Load image from bytes
            pil_image = Image.open(io.BytesIO(image)).convert('RGB')
            
            # Preprocess image
            image_tensor = self.preprocess(pil_image).unsqueeze(0).to(self.device)
            
            if self.device == "cuda":
                image_tensor = image_tensor.half()
            
            # Tokenize text descriptions
            text = self.tokenizer(text_descriptions).to(self.device)
            
            # Get similarity scores
            with torch.no_grad():
                image_features = self.model.encode_image(image_tensor)
                text_features = self.model.encode_text(text)
                
                image_features /= image_features.norm(dim=-1, keepdim=True)
                text_features /= text_features.norm(dim=-1, keepdim=True)
                
                similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            
            # Get probabilities
            probs = similarity[0].cpu().float().numpy()
            
            # Return sorted list of (description, probability)
            results = [(text_descriptions[i], float(probs[i])) for i in range(len(text_descriptions))]
            results.sort(key=lambda x: x[1], reverse=True)
            
            return results
            
        except Exception as e:
            print(f"Error in image classification: {str(e)}")
            raise
    
    def assess_plant_health(self, image: bytes, plant_name: str, location: str = "") -> Dict:
        """
        Assess the health of a plant from an image using BioCLIP.
        
        Args:
            image: Image bytes to analyze
            plant_name: Scientific name of the plant
            location: Optional location information
            
        Returns:
            Dictionary containing health assessment
        """
        try:
            print(f"Assessing health of {plant_name} using BioCLIP...")
            
            # Step 1: Determine overall health status
            health_texts = []
            health_status_map = {}
            for status, descriptions in self.HEALTH_CATEGORIES.items():
                for desc in descriptions:
                    health_texts.append(desc)
                    health_status_map[desc] = status
            
            health_results = self._classify_image_with_texts(image, health_texts)
            
            # Get the top health category
            top_health_desc, top_health_prob = health_results[0]
            overall_status = health_status_map[top_health_desc]
            
            # Aggregate probabilities by status
            status_probs = {}
            for desc, prob in health_results:
                status = health_status_map[desc]
                status_probs[status] = status_probs.get(status, 0) + prob
            
            # Step 2: Check for specific issues ONLY if plant is not healthy
            detected_issues = []
            
            # Only detect specific issues if the plant has problems
            if overall_status != "healthy":
                issue_texts = []
                issue_category_map = {}
                for category, descriptions in self.ISSUE_CATEGORIES.items():
                    for desc in descriptions:
                        issue_texts.append(desc)
                        issue_category_map[desc] = category
                
                issue_results = self._classify_image_with_texts(image, issue_texts)
                
                # Identify issues with probability > threshold
                issue_threshold = 0.15  # If any issue has >15% probability, flag it
                for desc, prob in issue_results:
                    if prob > issue_threshold:
                        category = issue_category_map[desc]
                        detected_issues.append({
                            "issue": category.replace("_", " ").title(),
                            "severity": self._determine_severity(prob),
                            "confidence": prob,
                            "description": desc
                        })
            
            # Step 3: Calculate health score (0-100)
            health_score = self._calculate_health_score(status_probs, overall_status)
            
            # Step 4: Generate observations and recommendations
            visual_observations = self._generate_observations(
                overall_status, status_probs, detected_issues
            )
            
            positive_indicators = self._generate_positive_indicators(overall_status, status_probs)
            
            recommended_actions = self._generate_recommendations(
                overall_status, detected_issues
            )
            
            monitoring_notes = self._generate_monitoring_notes(overall_status, detected_issues)
            
            # Determine overall confidence
            confidence = float(max(status_probs.values()))
            
            return {
                "success": True,
                "overall_status": self._map_status_to_simple(overall_status),
                "health_score": health_score,
                "confidence": confidence,
                "visual_observations": visual_observations,
                "issues_detected": detected_issues,
                "positive_indicators": positive_indicators,
                "recommended_actions": recommended_actions,
                "monitoring_notes": monitoring_notes,
                "raw_health_probabilities": status_probs
            }
            
        except Exception as e:
            print(f"Error assessing plant health: {str(e)}")
            return {
                "success": False,
                "error": f"Error assessing plant health: {str(e)}",
                "overall_status": "unknown",
                "health_score": 0,
                "confidence": 0.0
            }
    
    def _map_status_to_simple(self, status: str) -> str:
        """Map detailed status to simple categories."""
        mapping = {
            "healthy": "healthy",
            "minor_stress": "watch",
            "moderate_issues": "declining",
            "severe_issues": "critical"
        }
        return mapping.get(status, "unknown")
    
    def _calculate_health_score(self, status_probs: Dict[str, float], overall_status: str) -> int:
        """Calculate a 0-100 health score based on status probabilities."""
        # Base score on overall status
        base_scores = {
            "healthy": 90,
            "minor_stress": 70,
            "moderate_issues": 45,
            "severe_issues": 20
        }
        
        base = base_scores.get(overall_status, 50)
        
        # Adjust based on confidence in the assessment
        healthy_prob = status_probs.get("healthy", 0)
        severe_prob = status_probs.get("severe_issues", 0)
        
        # If there's high confidence in healthy, boost score
        # If there's any severe probability, reduce score
        adjustment = int(healthy_prob * 10 - severe_prob * 20)
        
        score = base + adjustment
        return max(0, min(100, score))  # Clamp to 0-100
    
    def _determine_severity(self, probability: float) -> str:
        """Determine severity level based on probability."""
        if probability > 0.3:
            return "severe"
        elif probability > 0.2:
            return "moderate"
        else:
            return "minor"
    
    def _generate_observations(self, status: str, status_probs: Dict, issues: List[Dict]) -> List[str]:
        """Generate visual observations based on assessment."""
        observations = []
        
        if status == "healthy":
            observations.append("Plant appears vibrant with good coloration")
            observations.append("Leaves show healthy texture and structure")
        elif status == "minor_stress":
            observations.append("Some minor discoloration visible on leaves")
            observations.append("Overall structure appears intact")
        elif status == "moderate_issues":
            observations.append("Visible signs of stress on foliage")
            observations.append("Some leaves showing damage or discoloration")
        else:  # severe_issues
            observations.append("Significant damage or decay visible")
            observations.append("Multiple symptoms present on plant")
        
        # Add issue-specific observations ONLY if issues were detected
        if issues:
            for issue in issues[:2]:  # Top 2 issues
                observations.append(f"Signs of {issue['issue'].lower()} detected")
        
        return observations
    
    def _generate_positive_indicators(self, status: str, status_probs: Dict) -> List[str]:
        """Generate positive indicators."""
        positive = []
        
        if status_probs.get("healthy", 0) > 0.2:
            positive.append("Good overall plant structure maintained")
        
        if status in ["healthy", "minor_stress"]:
            positive.append("No critical health issues detected")
            positive.append("Plant showing resilience")
        
        return positive if positive else ["Plant is alive and can potentially recover with proper care"]
    
    def _generate_recommendations(self, status: str, issues: List[Dict]) -> List[Dict]:
        """Generate recommended actions."""
        actions = []
        
        if status == "healthy":
            actions.append({
                "action": "Continue current care routine",
                "urgency": "routine",
                "reason": "Plant is healthy and thriving"
            })
        elif status == "minor_stress":
            actions.append({
                "action": "Monitor plant closely over next week",
                "urgency": "routine",
                "reason": "Early stress detection allows for preventive care"
            })
        elif status == "moderate_issues":
            actions.append({
                "action": "Investigate and address visible symptoms",
                "urgency": "within_week",
                "reason": "Moderate issues can escalate if left untreated"
            })
        else:  # severe
            actions.append({
                "action": "Immediate intervention required",
                "urgency": "immediate",
                "reason": "Critical health issues detected"
            })
        
        # Add issue-specific actions
        for issue in issues[:3]:
            if "pest" in issue['issue'].lower():
                actions.append({
                    "action": "Inspect for pests and apply appropriate treatment",
                    "urgency": "within_week" if issue['severity'] != "severe" else "immediate",
                    "reason": f"Pest activity detected with {issue['severity']} severity"
                })
            elif "disease" in issue['issue'].lower():
                actions.append({
                    "action": "Isolate plant and treat for disease",
                    "urgency": "immediate",
                    "reason": "Disease can spread to nearby plants"
                })
            elif "water" in issue['issue'].lower():
                actions.append({
                    "action": "Adjust watering schedule",
                    "urgency": "within_week",
                    "reason": "Water stress detected"
                })
            elif "nutrient" in issue['issue'].lower():
                actions.append({
                    "action": "Consider fertilizer application",
                    "urgency": "within_week",
                    "reason": "Signs of nutrient deficiency"
                })
        
        return actions
    
    def _generate_monitoring_notes(self, status: str, issues: List[Dict]) -> str:
        """Generate monitoring notes for staff."""
        if status == "healthy":
            return "Continue regular monitoring schedule. Watch for any changes in leaf color or texture."
        elif status == "minor_stress":
            return "Re-check in 3-5 days. Monitor if symptoms progress or stabilize."
        elif status == "moderate_issues":
            return "Check daily for progression. Document any changes in symptoms."
        else:
            return "Monitor multiple times daily. Track response to interventions."
    
    def format_health_summary(self, assessment: Dict) -> str:
        """
        Format a health assessment into a human-readable summary.
        
        Args:
            assessment: Health assessment dictionary
            
        Returns:
            Formatted string summary
        """
        if not assessment.get("success"):
            return "Health assessment unavailable"
        
        status = assessment.get("overall_status", "unknown").upper()
        score = assessment.get("health_score", 0)
        
        summary_parts = [
            f"Status: {status} (Score: {score}/100)",
            "",
            "Observations:"
        ]
        
        # Add visual observations
        for obs in assessment.get("visual_observations", []):
            summary_parts.append(f"  • {obs}")
        
        # Add issues if any
        issues = assessment.get("issues_detected", [])
        if issues:
            summary_parts.append("\nIssues Detected:")
            for issue in issues:
                summary_parts.append(
                    f"  • {issue['issue']} ({issue['severity']})"
                )
        
        # Add recommended actions
        actions = assessment.get("recommended_actions", [])
        if actions:
            summary_parts.append("\nRecommended Actions:")
            for action in actions[:3]:  # Top 3 actions
                urgency = action['urgency'].replace('_', ' ').title()
                summary_parts.append(f"  • [{urgency}] {action['action']}")
        
        return "\n".join(summary_parts)