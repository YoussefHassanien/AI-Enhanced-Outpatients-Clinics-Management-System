import cv2
import os
os.environ["DISABLE_MODEL_SOURCE_CHECK"] = "True"
from paddleocr import PaddleOCR
from ultralytics import YOLO
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get logger
logger = logging.getLogger(__name__)

# Get the directory where this script is located (src/core)
SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # Go up to ocr/
RUNS_DIR = os.path.join(SCRIPT_DIR, 'runs')

# Model paths (in models/ directory)
MODELS_DIR = os.path.join(SCRIPT_DIR, 'models')
CLASS_MODEL_OPENVINO = os.path.join(MODELS_DIR, 'Class_openvino_model')
ID_MODEL_OPENVINO = os.path.join(MODELS_DIR, 'ID_openvino_model')
CLASS_MODEL_PT = os.path.join(MODELS_DIR, 'Class.pt')
ID_MODEL_PT = os.path.join(MODELS_DIR, 'ID.pt')

# Configuration from environment
USE_OPENVINO = os.getenv('USE_OPENVINO', 'true').lower() == 'true'
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.6'))
ID_DIGIT_CONFIDENCE = float(os.getenv('ID_DIGIT_CONFIDENCE', '0.25'))
IMAGE_SIZE = int(os.getenv('IMAGE_SIZE', '640'))

# Select which models to use
if USE_OPENVINO and os.path.exists(CLASS_MODEL_OPENVINO):
    CLASS_MODEL_PATH = CLASS_MODEL_OPENVINO
    logger.info("Using OpenVINO classification model")
elif os.path.exists(CLASS_MODEL_PT):
    CLASS_MODEL_PATH = CLASS_MODEL_PT
    logger.info("Using PyTorch classification model")
else:
    raise FileNotFoundError("No classification model found")

if USE_OPENVINO and os.path.exists(ID_MODEL_OPENVINO):
    ID_MODEL_PATH = ID_MODEL_OPENVINO
    logger.info("Using OpenVINO ID digit model")
elif os.path.exists(ID_MODEL_PT):
    ID_MODEL_PATH = ID_MODEL_PT
    logger.info("Using PyTorch ID digit model")
else:
    raise FileNotFoundError("No ID digit model found")

# ===== MODEL INITIALIZATION =====
# Global models - loaded once and reused (singleton pattern for FastAPI)
_CLASS_MODEL = None
_ID_MODEL = None
_OCR_MODEL = None


def get_class_model():
    """Lazy load classification model (singleton pattern)"""
    global _CLASS_MODEL
    if _CLASS_MODEL is None:
        logger.info(f"Loading classification model: {os.path.basename(CLASS_MODEL_PATH)}")
        _CLASS_MODEL = YOLO(CLASS_MODEL_PATH)
        logger.info("Classification model loaded successfully")
    return _CLASS_MODEL


def get_id_model():
    """Lazy load ID digit detection model (singleton pattern)"""
    global _ID_MODEL
    if _ID_MODEL is None:
        logger.info(f"Loading ID digit model: {os.path.basename(ID_MODEL_PATH)}")
        _ID_MODEL = YOLO(ID_MODEL_PATH)
        logger.info("ID digit model loaded successfully")
    return _ID_MODEL


def get_ocr_model():
    """Lazy load PaddleOCR model (singleton pattern)"""
    global _OCR_MODEL
    if _OCR_MODEL is None:
        logger.info("Loading PaddleOCR model")
        _OCR_MODEL = PaddleOCR(lang='ar',
                               use_doc_orientation_classify=False,
                               use_doc_unwarping=False,
                               use_textline_orientation=False)
        logger.info("PaddleOCR model loaded successfully")
    return _OCR_MODEL


def preload_models():
    """Preload all models at startup (for FastAPI lifespan)"""
    logger.info("Preloading all models...")
    get_ocr_model()
    get_class_model()
    get_id_model()
    logger.info("All models loaded successfully")


# ===================================


def extract_digits_from_id(id_image_path, conf_threshold=0.25):
    """
    Extract digits from an ID card image and return them as a string
    
    Args:
        model_path: Path to the trained model (.pt file)
        id_image_path: Path to the ID card image
        conf_threshold: Confidence threshold for predictions
        use_preprocessing: Whether to apply image preprocessing
    
    Returns:
        str: Detected digits as a string (sorted by x-coordinate)
    """
    # Get the model (lazy loaded singleton)
    model = get_id_model()

    # Run prediction
    results = model.predict(source=id_image_path,
                            conf=conf_threshold,
                            verbose=False)

    # Extract and sort detections by x-coordinate (left to right)
    detections = []
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            x_center = (xyxy[0] + xyxy[2]) / 2

            detections.append({
                'digit': model.names[cls],
                'confidence': conf,
                'x_center': x_center,
                'box': xyxy
            })

    # Sort by x-coordinate
    detections.sort(key=lambda x: x['x_center'])

    # Extract digits as string
    digit_string = ''.join([d['digit'] for d in detections])

    # print(f"\nExtracted ID Number: {digit_string}")
    # print(f"Number of digits detected: {len(detections)}")
    # for i, det in enumerate(detections):
    #     print(f"  Position {i+1}: {det['digit']} (confidence: {det['confidence']:.2f})")

    return digit_string, detections


def predict_id(path, request_id='default'):
    """
    Run YOLO prediction on ID card image
    
    Args:
        path: Path to the image file
        request_id: Unique identifier for this request (for folder isolation)
    """
    model = get_class_model()
    # Set project directory to OCR/runs with unique request_id subfolder
    results = model(path,
                    save=True,
                    conf=CONFIDENCE_THRESHOLD,
                    imgsz=IMAGE_SIZE,
                    show=False,
                    save_crop=True,
                    project=RUNS_DIR,
                    name=request_id)  # Use request_id as folder name
    return results


def save_top_right_boxes(path, save_dir, results):
    """
    Save the top 3 topmost boxes (excluding "egyptian-id" and "pic") to folders named "1", "2", and "3"
    """
    # Get the original image
    original_img = cv2.imread(path)
    file_name = os.path.basename(path)

    # Get class names from the model
    model = get_class_model()
    class_names = model.names

    # Extract boxes from YOLO results
    boxes_info = []
    for result in results:
        boxes = result.boxes
        for box in boxes:
            # Get bounding box coordinates (xyxy format)
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            class_name = class_names[cls]

            # Calculate center point and area
            center_x = (x1 + x2) / 2
            center_y = (y1 + y2) / 2
            area = (x2 - x1) * (y2 - y1)

            boxes_info.append({
                'x1': x1,
                'y1': y1,
                'x2': x2,
                'y2': y2,
                'center_x': center_x,
                'center_y': center_y,
                'area': area,
                'cls': cls,
                'conf': conf,
                'class_name': class_name
            })

    if len(boxes_info) == 0:
        raise ValueError("No boxes detected for top extraction!")

    # Filter out "egyptian-id" and "pic" boxes
    filtered_boxes = [
        box for box in boxes_info
        if box['class_name'] not in ['egyptian-id', 'pic']
    ]

    if len(filtered_boxes) < 3:
        raise ValueError("Not enough boxes detected after filtering!")

    # Sort remaining boxes by y position (topmost first)
    filtered_boxes.sort(key=lambda x: x['center_y'])

    # Take top 3 boxes
    top_3_boxes = filtered_boxes[:3]

    # Determine save directory
    if save_dir:
        crops_dir = os.path.join(save_dir, 'crops')
    else:
        crops_dir = r'runs\detect\predict2\crops'

    # Create output directories
    os.makedirs(os.path.join(crops_dir, '1'), exist_ok=True)
    os.makedirs(os.path.join(crops_dir, '2'), exist_ok=True)
    os.makedirs(os.path.join(crops_dir, '3'), exist_ok=True)

    # Crop and save the top 3 boxes
    for i, box_info in enumerate(top_3_boxes, start=1):
        cropped = original_img[int(box_info['y1']):int(box_info['y2']),
                               int(box_info['x1']):int(box_info['x2'])]
        output_path = os.path.join(crops_dir, str(i), file_name)
        cv2.imwrite(output_path, cropped)
        print(
            f"Saved top box #{i} ({box_info['class_name']}) to: {output_path}")
