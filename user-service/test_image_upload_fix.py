"""
Test script for verifying the image upload validation fix.

This script tests the following scenarios:
1. Correct plant image - should upload successfully
2. Incorrect plant image - should reject without upload
3. Corrupted/invalid image - should fail classification
4. Non-plant image - should fail or mismatch

The script checks the database before and after each test to confirm upload behavior.
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from game_utils.supabase_handler import SupabaseHandler

# Load environment variables
load_dotenv()

# API endpoint
API_BASE_URL = "http://localhost:8000/api/game"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def get_user_images_count():
    """Get the current count of user images in the database"""
    try:
        handler = SupabaseHandler()
        # Query the user_plant_images table
        response = handler.supabase.table("user_plant_images").select("id", count="exact").execute()
        return response.count if hasattr(response, 'count') else len(response.data)
    except Exception as e:
        print(f"Error querying database: {e}")
        return None

def test_correct_plant_image():
    """Test 1: Submit a correct plant image - should upload successfully"""
    print_section("TEST 1: Correct Plant Image (Should Upload)")
    
    # Use Adiantum peruvianum image
    image_path = Path("../data/example_images/Adiantum-peruvianum-Silver-Dollar-Fern-Amazon-Spheres.jpg.webp")
    plant_name = "Adiantum peruvianum"
    dome_type = "Tropical"
    
    if not image_path.exists():
        print(f"❌ Test image not found: {image_path}")
        return False
    
    # Get initial count
    initial_count = get_user_images_count()
    print(f"Initial database count: {initial_count}")
    
    # Submit the image
    print(f"Submitting image: {image_path.name}")
    print(f"Target plant: {plant_name}")
    print(f"Dome: {dome_type}\n")
    
    try:
        with open(image_path, "rb") as f:
            files = {"image": (image_path.name, f, "image/webp")}
            data = {"dome_type": dome_type, "plant_name": plant_name}
            response = requests.post(f"{API_BASE_URL}/submit-image", files=files, data=data)
        
        result = response.json()
        print(f"Response status: {response.status_code}")
        print(f"Response body: {result}\n")
        
        # Get final count
        final_count = get_user_images_count()
        print(f"Final database count: {final_count}")
        
        # Verify results
        success = result.get("success", False)
        classified_plant = result.get("classified_plant")
        confidence = result.get("confidence", 0)
        target_plant = result.get("target_plant")
        message = result.get("message", "")
        
        print(f"\n📊 Results:")
        print(f"  Success: {success}")
        print(f"  Classified as: {classified_plant}")
        print(f"  Confidence: {confidence:.1%}")
        print(f"  Target plant: {target_plant}")
        print(f"  Message: {message}")
        
        if success and final_count == initial_count + 1:
            print(f"\n✅ TEST PASSED: Image uploaded successfully")
            return True
        else:
            print(f"\n❌ TEST FAILED: Expected success=True and count increase")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False

def test_incorrect_plant_image():
    """Test 2: Submit an incorrect plant image - should reject without upload"""
    print_section("TEST 2: Incorrect Plant Image (Should Reject)")
    
    # Use Berberis haematocarpa image but claim it's Adiantum peruvianum
    image_path = Path("../data/example_images/Berberis_haematocarpa.jpg")
    plant_name = "Adiantum peruvianum"  # Wrong plant name
    dome_type = "Tropical"
    
    if not image_path.exists():
        print(f"❌ Test image not found: {image_path}")
        return False
    
    # Get initial count
    initial_count = get_user_images_count()
    print(f"Initial database count: {initial_count}")
    
    # Submit the image
    print(f"Submitting image: {image_path.name}")
    print(f"Target plant: {plant_name} (but image is actually Berberis haematocarpa)")
    print(f"Dome: {dome_type}\n")
    
    try:
        with open(image_path, "rb") as f:
            files = {"image": (image_path.name, f, "image/jpeg")}
            data = {"dome_type": dome_type, "plant_name": plant_name}
            response = requests.post(f"{API_BASE_URL}/submit-image", files=files, data=data)
        
        result = response.json()
        print(f"Response status: {response.status_code}")
        print(f"Response body: {result}\n")
        
        # Get final count
        final_count = get_user_images_count()
        print(f"Final database count: {final_count}")
        
        # Verify results
        success = result.get("success", False)
        classified_plant = result.get("classified_plant")
        confidence = result.get("confidence", 0)
        target_plant = result.get("target_plant")
        message = result.get("message", "")
        
        print(f"\n📊 Results:")
        print(f"  Success: {success}")
        print(f"  Classified as: {classified_plant}")
        print(f"  Confidence: {confidence:.1%}")
        print(f"  Target plant: {target_plant}")
        print(f"  Message: {message}")
        
        if not success and final_count == initial_count:
            print(f"\n✅ TEST PASSED: Image rejected, no upload occurred")
            return True
        else:
            print(f"\n❌ TEST FAILED: Expected success=False and no count increase")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False

def test_corrupted_image():
    """Test 3: Submit a corrupted image - should fail classification"""
    print_section("TEST 3: Corrupted Image (Should Fail Classification)")
    
    # Create a temporary corrupted image file
    corrupted_path = Path("../data/example_images/corrupted_test.jpg")
    plant_name = "Adiantum peruvianum"
    dome_type = "Tropical"
    
    # Create corrupted image data
    with open(corrupted_path, "wb") as f:
        f.write(b"This is not a valid image file, just random bytes!")
    
    # Get initial count
    initial_count = get_user_images_count()
    print(f"Initial database count: {initial_count}")
    
    # Submit the corrupted image
    print(f"Submitting corrupted image")
    print(f"Target plant: {plant_name}")
    print(f"Dome: {dome_type}\n")
    
    try:
        with open(corrupted_path, "rb") as f:
            files = {"image": ("corrupted.jpg", f, "image/jpeg")}
            data = {"dome_type": dome_type, "plant_name": plant_name}
            response = requests.post(f"{API_BASE_URL}/submit-image", files=files, data=data)
        
        result = response.json()
        print(f"Response status: {response.status_code}")
        print(f"Response body: {result}\n")
        
        # Get final count
        final_count = get_user_images_count()
        print(f"Final database count: {final_count}")
        
        # Verify results
        success = result.get("success", False)
        message = result.get("message", "")
        
        print(f"\n📊 Results:")
        print(f"  Success: {success}")
        print(f"  Message: {message}")
        
        if not success and final_count == initial_count:
            print(f"\n✅ TEST PASSED: Corrupted image rejected, no upload occurred")
            return True
        else:
            print(f"\n❌ TEST FAILED: Expected success=False and no count increase")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False
    finally:
        # Clean up corrupted file
        if corrupted_path.exists():
            corrupted_path.unlink()

def main():
    """Run all tests"""
    print_section("IMAGE UPLOAD VALIDATION FIX - TEST SUITE")
    print("This test suite verifies that:")
    print("1. Correct plant images are uploaded successfully")
    print("2. Incorrect plant images are rejected WITHOUT upload")
    print("3. Corrupted images fail classification WITHOUT upload")
    print("\nMake sure the FastAPI server is running on http://localhost:8000")
    
    input("\nPress Enter to start tests...")
    
    # Run tests
    results = []
    results.append(("Correct Plant Image", test_correct_plant_image()))
    results.append(("Incorrect Plant Image", test_incorrect_plant_image()))
    results.append(("Corrupted Image", test_corrupted_image()))
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"Total: {passed}/{total} tests passed")
    print(f"{'='*80}\n")
    
    if passed == total:
        print("🎉 All tests passed! The fix is working correctly.")
    else:
        print("⚠️  Some tests failed. Please review the results above.")

if __name__ == "__main__":
    main()
