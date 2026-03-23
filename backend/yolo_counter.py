from ultralytics import YOLO
import numpy as np
from PIL import Image
import io

# Load YOLOv8n model (nano version for faster inference)
model = YOLO('yolov8n.pt')

def count_people(image_bytes):
    """
    Count people in an image using YOLOv8 detection.
    
    Args:
        image_bytes: Raw image bytes (e.g., from file upload or camera)
    
    Returns:
        int: Number of people detected (class 0)
    """
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Run YOLO detection
        results = model(image, verbose=False)
        
        # Count people (class 0 in COCO dataset)
        people_count = 0
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                # Filter for person class (class_id = 0)
                person_boxes = boxes[boxes.cls == 0]
                people_count = len(person_boxes)
        
        return people_count
        
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        return 0

def get_crowd_level(count):
    """
    Determine crowd level based on person count.
    
    Args:
        count: Number of people detected
    
    Returns:
        str: Crowd level ("low", "medium", "high")
    """
    if count <= 10:
        return "low"
    elif count <= 25:
        return "medium"
    else:
        return "high"

def analyze_crowd(image_bytes):
    """
    Complete crowd analysis from image bytes.
    
    Args:
        image_bytes: Raw image bytes
    
    Returns:
        dict: Contains count and crowd_level
    """
    count = count_people(image_bytes)
    crowd_level = get_crowd_level(count)
    
    return {
        'person_count': count,
        'crowd_level': crowd_level
    }
