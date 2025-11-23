"""
Script to upload correctly identified Wikipedia images to the database.

This script:
1. Reads the evaluation results from bioclip_wikipedia_eval.csv
2. Filters for plants that were correctly identified (top1_species_match == True)
3. Loads the corresponding images from data/wiki_images/
4. Uploads them to the database using the same flow as the user service
5. Optionally performs health assessment on each image
"""

import os
import sys
import pandas as pd
import time
from pathlib import Path

# Add user-service to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'user-service', 'src'))

from game_utils.supabase_handler import SupabaseHandler
from game_utils.plant_health_assesor import get_plant_health_assessor  # Note: filename has typo "assesor"


def slugify_name(name: str) -> str:
    """Convert plant name to filename slug (matches notebook logic)."""
    return ''.join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in name).replace(' ', '_')[:200]


def find_image_file(plant_name: str, wiki_images_dir: Path) -> Path:
    """
    Find the image file for a plant name.
    Tries exact slug match first, then partial matches.
    """
    slug = slugify_name(plant_name)
    exact_path = wiki_images_dir / f"{slug}.jpg"
    
    if exact_path.exists():
        return exact_path
    
    # Try case-insensitive match
    for img_file in wiki_images_dir.glob("*.jpg"):
        if img_file.stem.lower() == slug.lower():
            return img_file
    
    # Try matching first two words (genus + species)
    words = plant_name.split()
    if len(words) >= 2:
        two_word_slug = slugify_name(f"{words[0]} {words[1]}")
        two_word_path = wiki_images_dir / f"{two_word_slug}.jpg"
        if two_word_path.exists():
            return two_word_path
    
    # Try partial match (first word matches)
    first_word = words[0] if words else plant_name
    matches = list(wiki_images_dir.glob(f"{first_word}_*.jpg"))
    if matches:
        # Prefer exact match on first two words if available
        if len(words) >= 2:
            two_word_prefix = f"{words[0]}_{words[1]}"
            for match in matches:
                if match.stem.lower().startswith(two_word_prefix.lower()):
                    return match
        return matches[0]
    
    # Try without underscores
    slug_no_underscore = slug.replace('_', '')
    for img_file in wiki_images_dir.glob("*.jpg"):
        if img_file.stem.replace('_', '').lower() == slug_no_underscore.lower():
            return img_file
    
    return None


def upload_correct_images(
    csv_path: str = "data/bioclip_wikipedia_eval.csv",
    wiki_images_dir: str = "data/wiki_images",
    assess_health: bool = True,
    dry_run: bool = False
):
    """
    Upload correctly identified Wikipedia images to the database.
    
    Args:
        csv_path: Path to the evaluation CSV file
        wiki_images_dir: Directory containing downloaded Wikipedia images
        assess_health: Whether to perform health assessment on images
        dry_run: If True, only print what would be uploaded without actually uploading
    """
    # Read the evaluation CSV
    print(f"Reading evaluation results from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Filter for correctly identified plants with images
    correct_matches = df[
        (df['top1_species_match'] == True) & 
        (df['found_image'] == True)
    ].copy()
    
    print(f"Found {len(correct_matches)} correctly identified plants with images")
    
    if len(correct_matches) == 0:
        print("No correct matches found. Exiting.")
        return
    
    # Initialize services
    supabase_handler = SupabaseHandler()
    health_assessor = get_plant_health_assessor() if assess_health else None
    
    wiki_images_path = Path(wiki_images_dir)
    if not wiki_images_path.exists():
        print(f"Error: Wiki images directory not found: {wiki_images_dir}")
        return
    
    # Track statistics
    stats = {
        'total': len(correct_matches),
        'uploaded': 0,
        'failed': 0,
        'skipped': 0,
        'errors': []
    }
    
    # Process each correct match
    for idx, row in correct_matches.iterrows():
        plant_name = row['plant_name']
        dome = row['Dome']
        confidence = row['top_1_conf']
        
        print(f"\n[{stats['uploaded'] + stats['failed'] + stats['skipped'] + 1}/{stats['total']}] Processing: {plant_name} ({dome})")
        print(f"  Confidence: {confidence:.2%}")
        
        # Find the image file
        img_path = find_image_file(plant_name, wiki_images_path)
        if not img_path:
            print(f"  ⚠️  Image file not found for {plant_name}")
            stats['skipped'] += 1
            stats['errors'].append(f"{plant_name}: Image file not found")
            continue
        
        print(f"  📷 Found image: {img_path.name}")
        
        if dry_run:
            print(f"  [DRY RUN] Would upload {plant_name} from {img_path}")
            stats['uploaded'] += 1
            continue
        
        # Read image bytes
        try:
            with open(img_path, 'rb') as f:
                image_bytes = f.read()
        except Exception as e:
            print(f"  ❌ Error reading image file: {e}")
            stats['failed'] += 1
            stats['errors'].append(f"{plant_name}: Error reading image - {str(e)}")
            continue
        
        # Perform health assessment if requested
        health_assessment = None
        if assess_health and health_assessor:
            try:
                print(f"  🔍 Assessing plant health...")
                health_assessment = health_assessor.assess_plant_health(
                    image=image_bytes,
                    plant_name=plant_name,
                    location=dome
                )
                if health_assessment.get("success"):
                    print(f"  ✅ Health: {health_assessment.get('overall_status')} (score: {health_assessment.get('health_score')}/100)")
                else:
                    print(f"  ⚠️  Health assessment failed: {health_assessment.get('error', 'Unknown error')}")
            except Exception as e:
                print(f"  ⚠️  Error during health assessment: {e}")
                health_assessment = None
        
        # Upload to database
        try:
            print(f"  📤 Uploading to database...")
            upload_result = supabase_handler.upload_user_plant_image(
                scientific_name=plant_name,
                dome=dome,
                image=image_bytes,
                health_assessment=health_assessment
            )
            
            if upload_result.get("success"):
                print(f"  ✅ Upload successful! Image URL: {upload_result.get('image_url', 'N/A')}")
                stats['uploaded'] += 1
            else:
                error_msg = upload_result.get('error', 'Unknown error')
                print(f"  ❌ Upload failed: {error_msg}")
                stats['failed'] += 1
                stats['errors'].append(f"{plant_name}: Upload failed - {error_msg}")
        except Exception as e:
            print(f"  ❌ Exception during upload: {e}")
            stats['failed'] += 1
            stats['errors'].append(f"{plant_name}: Exception - {str(e)}")
        
        # Polite delay between uploads
        time.sleep(0.5)
    
    # Print summary
    print("\n" + "="*60)
    print("UPLOAD SUMMARY")
    print("="*60)
    print(f"Total correct matches: {stats['total']}")
    print(f"Successfully uploaded: {stats['uploaded']}")
    print(f"Failed: {stats['failed']}")
    print(f"Skipped (no image file): {stats['skipped']}")
    
    if stats['errors']:
        print(f"\nErrors encountered ({len(stats['errors'])}):")
        for error in stats['errors'][:10]:  # Show first 10 errors
            print(f"  - {error}")
        if len(stats['errors']) > 10:
            print(f"  ... and {len(stats['errors']) - 10} more errors")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Upload correctly identified Wikipedia images to the database"
    )
    parser.add_argument(
        "--csv",
        default="data/bioclip_wikipedia_eval.csv",
        help="Path to evaluation CSV file (default: data/bioclip_wikipedia_eval.csv)"
    )
    parser.add_argument(
        "--images-dir",
        default="data/wiki_images",
        help="Directory containing Wikipedia images (default: data/wiki_images)"
    )
    parser.add_argument(
        "--no-health",
        action="store_true",
        help="Skip health assessment (faster uploads)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Dry run mode: show what would be uploaded without actually uploading"
    )
    
    args = parser.parse_args()
    
    upload_correct_images(
        csv_path=args.csv,
        wiki_images_dir=args.images_dir,
        assess_health=not args.no_health,
        dry_run=args.dry_run
    )

