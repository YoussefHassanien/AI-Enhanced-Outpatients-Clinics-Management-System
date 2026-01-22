import shutil
import cv2
import os
import numpy as np
import yaml
from paddleocr import PaddleOCR
from openvino import Core
from ..config import logger
from dotenv import load_dotenv
from typing import List, Dict, Tuple

# Load environment variables
load_dotenv()

# Get the directory where this script is located (src/core)
SCRIPT_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))))  # Go up to ocr/
RUNS_DIR = os.path.join(SCRIPT_DIR, 'runs')

# Model paths (in models/ directory)
MODELS_DIR = os.path.join(SCRIPT_DIR, 'models')
CLASS_MODEL_XML = os.path.join(MODELS_DIR, 'Class_openvino_model',
                               'egyId_weights.xml')
CLASS_MODEL_METADATA = os.path.join(MODELS_DIR, 'Class_openvino_model',
                                    'metadata.yaml')
ID_MODEL_XML = os.path.join(MODELS_DIR, 'ID_openvino_model', 'best.xml')
ID_MODEL_METADATA = os.path.join(MODELS_DIR, 'ID_openvino_model',
                                 'metadata.yaml')

# Configuration from environment
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.6'))
ID_DIGIT_CONFIDENCE = float(os.getenv('ID_DIGIT_CONFIDENCE', '0.25'))
IMAGE_SIZE = int(os.getenv('IMAGE_SIZE', '640'))

# ===== MODEL INITIALIZATION =====
# Global models - loaded once and reused (singleton pattern)
_CLASS_MODEL = None
_CLASS_MODEL_METADATA = None
_ID_MODEL = None
_ID_MODEL_METADATA = None
_OCR_MODEL = None
_OV_CORE = None


def get_openvino_core():
    """Get or create OpenVINO Core instance (singleton)"""
    global _OV_CORE
    if _OV_CORE is None:
        _OV_CORE = Core()
    return _OV_CORE


def load_metadata(metadata_path: str) -> Dict:
    """Load model metadata from YAML file"""
    with open(metadata_path, 'r') as f:
        metadata = yaml.safe_load(f)
    return metadata


def letterbox(img: np.ndarray, new_shape=(640, 640), color=(114, 114, 114)):
    """
    Resize and pad image to new_shape while maintaining aspect ratio
    (YOLO preprocessing)
    """
    shape = img.shape[:2]  # current shape [height, width]

    # Scale ratio (new / old)
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])

    # Compute padding
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[
        1]  # wh padding

    dw /= 2  # divide padding into 2 sides
    dh /= 2

    if shape[::-1] != new_unpad:  # resize
        img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    img = cv2.copyMakeBorder(img,
                             top,
                             bottom,
                             left,
                             right,
                             cv2.BORDER_CONSTANT,
                             value=color)

    return img, r, (dw, dh)


def preprocess_image(
    image: np.ndarray,
    input_shape: Tuple[int,
                       int]) -> Tuple[np.ndarray, float, Tuple[float, float]]:
    """
    Preprocess image for YOLO inference
    Returns: (preprocessed_image, scale_ratio, padding)
    """
    # Letterbox resize
    img_resized, ratio, (dw, dh) = letterbox(image, new_shape=input_shape)

    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

    # Normalize to [0, 1] and transpose to (C, H, W)
    img_normalized = img_rgb.astype(np.float32) / 255.0
    img_transposed = np.transpose(img_normalized, (2, 0, 1))

    # Add batch dimension
    img_input = np.expand_dims(img_transposed, axis=0)

    return img_input, ratio, (dw, dh)


def xywh2xyxy(x: np.ndarray) -> np.ndarray:
    """Convert bounding box from [x_center, y_center, width, height] to [x1, y1, x2, y2]"""
    y = np.copy(x)
    y[..., 0] = x[..., 0] - x[..., 2] / 2  # x1
    y[..., 1] = x[..., 1] - x[..., 3] / 2  # y1
    y[..., 2] = x[..., 0] + x[..., 2] / 2  # x2
    y[..., 3] = x[..., 1] + x[..., 3] / 2  # y2
    return y


def nms(boxes: np.ndarray,
        scores: np.ndarray,
        iou_threshold: float = 0.45) -> List[int]:
    """Non-Maximum Suppression"""
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]

    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)

        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])

        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h

        iou = inter / (areas[i] + areas[order[1:]] - inter)

        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]

    return keep


def postprocess_yolo_output(output: np.ndarray,
                            conf_threshold: float,
                            iou_threshold: float = 0.45) -> List[Dict]:
    """
    Postprocess YOLO output to extract detections
    YOLOv8 output shape: [1, 4 + num_classes, num_detections]
    Need to transpose to: [num_detections, 4 + num_classes]
    """
    detections = []

    output = output[
        0]  # Remove batch dimension -> [4+num_classes, num_detections]

    # YOLOv8 outputs [4+num_classes, num_detections], need to transpose
    if output.shape[0] < output.shape[1]:
        output = output.T  # Transpose to [num_detections, 4+num_classes]

    logger.debug(f"Postprocess output shape after transpose: {output.shape}")

    # Extract boxes and scores
    # YOLO output format: [x_center, y_center, width, height, class_scores...]
    boxes = output[:, :4]  # x, y, w, h
    class_scores = output[:, 4:]  # class scores

    # Get max class score and class index for each detection
    max_scores = np.max(class_scores, axis=1)
    max_classes = np.argmax(class_scores, axis=1)

    # Filter by confidence threshold
    mask = max_scores > conf_threshold
    boxes = boxes[mask]
    scores = max_scores[mask]
    classes = max_classes[mask]

    logger.debug(f"Detections after confidence filter: {len(boxes)}")

    if len(boxes) == 0:
        return detections

    # Convert boxes from xywh to xyxy
    boxes_xyxy = xywh2xyxy(boxes)

    # Apply NMS per class
    unique_classes = np.unique(classes)
    for cls in unique_classes:
        cls_mask = classes == cls
        cls_boxes = boxes_xyxy[cls_mask]
        cls_scores = scores[cls_mask]
        cls_indices = np.where(cls_mask)[0]

        # Apply NMS
        keep_indices = nms(cls_boxes, cls_scores, iou_threshold)

        for idx in keep_indices:
            original_idx = cls_indices[idx]
            detections.append({
                'box': boxes_xyxy[original_idx].tolist(),
                'confidence': float(scores[original_idx]),
                'class': int(cls)
            })

    return detections


class OpenVINOYOLOModel:
    """Wrapper for OpenVINO YOLO model"""

    def __init__(self, model_path: str, metadata_path: str):
        self.core = get_openvino_core()
        self.model = self.core.read_model(model_path)
        self.compiled_model = self.core.compile_model(self.model, "CPU")
        self.output_layer = self.compiled_model.output(0)
        self.input_layer = self.compiled_model.input(0)

        # Load metadata
        self.metadata = load_metadata(metadata_path)
        self.names = self.metadata.get('names', {})
        self.imgsz = tuple(self.metadata.get('imgsz', [640, 640]))
        self.stride = self.metadata.get('stride', 32)

        logger.info(f"Loaded OpenVINO model: {os.path.basename(model_path)}")
        logger.info(
            f"Input shape: {self.input_layer.shape}, Output shape: {self.output_layer.shape}"
        )
        logger.info(f"Classes: {self.names}")

    def predict(self,
                image: np.ndarray,
                conf: float = 0.25,
                iou: float = 0.45) -> List[Dict]:
        """Run inference on image"""
        original_shape = image.shape[:2]

        # Preprocess
        input_tensor, ratio, (dw, dh) = preprocess_image(image, self.imgsz)

        # Inference
        result = self.compiled_model([input_tensor])[self.output_layer]
        logger.debug(f"Raw model output shape: {result.shape}")

        # Postprocess
        detections = postprocess_yolo_output(result, conf, iou)
        logger.debug(f"Number of detections: {len(detections)}")

        # Scale boxes back to original image
        h, w = original_shape
        for det in detections:
            box = det['box']
            # Remove padding and scale
            box[0] = (box[0] - dw) / ratio
            box[1] = (box[1] - dh) / ratio
            box[2] = (box[2] - dw) / ratio
            box[3] = (box[3] - dh) / ratio
            # Clamp coordinates to image boundaries
            box[0] = max(0, min(box[0], w))
            box[1] = max(0, min(box[1], h))
            box[2] = max(0, min(box[2], w))
            box[3] = max(0, min(box[3], h))
            det['box'] = box

        return detections


def get_class_model():
    """Lazy load classification model (singleton pattern)"""
    global _CLASS_MODEL
    if _CLASS_MODEL is None:
        logger.info("Loading Egyptian ID classification model (OpenVINO)...")
        _CLASS_MODEL = OpenVINOYOLOModel(CLASS_MODEL_XML, CLASS_MODEL_METADATA)
        logger.info("Classification model loaded")
    return _CLASS_MODEL


def get_id_model():
    """Lazy load ID digit detection model (singleton pattern)"""
    global _ID_MODEL
    if _ID_MODEL is None:
        logger.info("Loading ID digit detection model (OpenVINO)...")
        _ID_MODEL = OpenVINOYOLOModel(ID_MODEL_XML, ID_MODEL_METADATA)
        logger.info("ID digit model loaded")
    return _ID_MODEL


def get_ocr_model():
    """Lazy load PaddleOCR model (singleton pattern)"""
    global _OCR_MODEL
    if _OCR_MODEL is None:
        logger.info("Loading PaddleOCR model...")
        _OCR_MODEL = PaddleOCR(lang='ar',
                               use_doc_orientation_classify=False,
                               use_doc_unwarping=False,
                               use_textline_orientation=False)
        logger.info("PaddleOCR model loaded")
    return _OCR_MODEL


def preload_models():
    """Preload all models at startup"""
    logger.info("Preloading all models...")
    get_ocr_model()
    get_class_model()
    get_id_model()
    logger.info("All models preloaded successfully")


# ===================================


def extract_digits_from_id(id_image_path, conf_threshold=0.25):
    """
    Extract digits from an ID card image and return them as a string
    
    Args:
        id_image_path: Path to the ID card image
        conf_threshold: Confidence threshold for predictions
    
    Returns:
        tuple: (digit_string, list of detection details)
    """
    model = get_id_model()

    # Load image
    image = cv2.imread(id_image_path)
    if image is None:
        raise ValueError(f"Failed to load image: {id_image_path}")

    # Run inference
    detections = model.predict(image, conf=conf_threshold)

    # Sort detections by x-coordinate (left to right)
    detection_list = []
    for det in detections:
        box = det['box']
        x_center = (box[0] + box[2]) / 2

        detection_list.append({
            'digit': model.names[det['class']],
            'confidence': det['confidence'],
            'x_center': x_center,
            'box': box
        })

    # Sort by x-coordinate
    detection_list.sort(key=lambda x: x['x_center'])

    # Extract digits as string
    digit_string = ''.join([d['digit'] for d in detection_list])

    logger.debug(
        f"Extracted ID: {digit_string} ({len(detection_list)} digits)")

    return digit_string, detection_list


def predict_id(path, request_id='default'):
    """
    Run YOLO prediction on ID card image
    
    Args:
        path: Path to the image file
        request_id: Unique identifier for this request (for folder isolation)
    
    Returns:
        tuple: (detections, save_dir)
    """
    model = get_class_model()

    # Load image
    image = cv2.imread(path)
    if image is None:
        raise ValueError(f"Failed to load image: {path}")

    # Run inference
    detections = model.predict(image, conf=CONFIDENCE_THRESHOLD)

    # Create save directory for this request
    save_dir = os.path.join(RUNS_DIR, request_id)
    os.makedirs(save_dir, exist_ok=True)

    # Save annotated image
    img_annotated = image.copy()
    for det in detections:
        box = det['box']
        cls = det['class']
        conf = det['confidence']
        class_name = model.names.get(cls, str(cls))

        # Draw box
        x1, y1, x2, y2 = map(int, box)
        cv2.rectangle(img_annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Draw label
        label = f"{class_name} {conf:.2f}"
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img_annotated, (x1, y1 - 20), (x1 + w, y1), (0, 255, 0),
                      -1)
        cv2.putText(img_annotated, label, (x1, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

    # Save annotated image
    output_image_path = os.path.join(save_dir, os.path.basename(path))
    cv2.imwrite(output_image_path, img_annotated)

    return detections, save_dir


def save_top_right_boxes(path, save_dir, detections):
    """
    Save the top 3 topmost boxes (excluding "egyptian-id" and "pic") to folders named "1", "2", and "3"
    Also saves "egyptian-id" crop if detected
    
    Args:
        path: Original image path
        save_dir: Directory to save crops
        detections: List of detection dictionaries from predict_id
    """
    # Load original image
    original_img = cv2.imread(path)
    if original_img is None:
        raise ValueError(f"Failed to load image: {path}")

    file_name = os.path.basename(path)
    model = get_class_model()

    # Convert detections to boxes_info format
    boxes_info = []
    for det in detections:
        box = det['box']
        cls = det['class']
        conf = det['confidence']
        class_name = model.names.get(cls, str(cls))

        x1, y1, x2, y2 = box
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
        logger.error("No boxes detected for top extraction!")
        raise ValueError("No boxes detected!")

    # Filter out "egyptian-id" and "pic" boxes for text extraction
    filtered_boxes = [
        box for box in boxes_info
        if box['class_name'] not in ['egyptian-id', 'pic']
    ]

    if len(filtered_boxes) < 3:
        raise ValueError(
            f"Not enough text boxes detected: {len(filtered_boxes)} < 3")

    # Sort remaining boxes by y position (topmost first)
    filtered_boxes.sort(key=lambda x: x['center_y'])

    # Take top 3 boxes
    top_3_boxes = filtered_boxes[:3]

    # Create output directories
    crops_dir = os.path.join(save_dir, 'crops')
    os.makedirs(os.path.join(crops_dir, '1'), exist_ok=True)
    os.makedirs(os.path.join(crops_dir, '2'), exist_ok=True)
    os.makedirs(os.path.join(crops_dir, '3'), exist_ok=True)
    os.makedirs(os.path.join(crops_dir, 'egyptian-id'), exist_ok=True)

    # Crop and save the top 3 text boxes
    img_h, img_w = original_img.shape[:2]
    for i, box_info in enumerate(top_3_boxes, start=1):
        x1, y1, x2, y2 = int(box_info['x1']), int(box_info['y1']), int(
            box_info['x2']), int(box_info['y2'])
        # Ensure valid crop region
        x1 = max(0, min(x1, img_w))
        y1 = max(0, min(y1, img_h))
        x2 = max(0, min(x2, img_w))
        y2 = max(0, min(y2, img_h))

        if x2 <= x1 or y2 <= y1:
            logger.warning(
                f"Invalid crop region for box #{i}: ({x1},{y1})-({x2},{y2}), skipping"
            )
            continue

        cropped = original_img[y1:y2, x1:x2]
        if cropped.size == 0:
            logger.warning(f"Empty crop for box #{i}, skipping")
            continue

        output_path = os.path.join(crops_dir, str(i), file_name)
        cv2.imwrite(output_path, cropped)
        logger.debug(
            f"Saved box #{i} ({box_info['class_name']}) to: {output_path}")

    # Save egyptian-id crop if found
    egyptian_id_boxes = [
        box for box in boxes_info if box['class_name'] == 'egyptian-id'
    ]
    if egyptian_id_boxes:
        box_info = egyptian_id_boxes[0]  # Take first egyptian-id box
        x1, y1, x2, y2 = int(box_info['x1']), int(box_info['y1']), int(
            box_info['x2']), int(box_info['y2'])
        # Ensure valid crop region
        x1 = max(0, min(x1, img_w))
        y1 = max(0, min(y1, img_h))
        x2 = max(0, min(x2, img_w))
        y2 = max(0, min(y2, img_h))

        if x2 > x1 and y2 > y1:
            cropped = original_img[y1:y2, x1:x2]
            if cropped.size > 0:
                output_path = os.path.join(crops_dir, 'egyptian-id', file_name)
                cv2.imwrite(output_path, cropped)
                logger.debug(f"Saved egyptian-id crop to: {output_path}")
            else:
                logger.warning("Empty crop for egyptian-id, skipping")
        else:
            logger.warning(
                f"Invalid crop region for egyptian-id: ({x1},{y1})-({x2},{y2}), skipping"
            )


def process_id_card(image_path: str, request_id: str):
    """
    Main processing function for ID card
    Returns extracted information as a dictionary
    
    Args:
        image_path: Path to the uploaded image
        request_id: Unique identifier for this request (for isolated folders)
    """
    save_dir = None

    try:
        # Run YOLO detection with unique request ID
        logger.info(f"[{request_id}] Starting ID card processing pipeline")

        detections, save_dir = predict_id(image_path, request_id)

        logger.info(
            f"[{request_id}] YOLO detection completed, ({len(detections)} objects found)"
        )

        if not save_dir:
            raise ValueError("Failed to process image")

        # Save cropped regions
        try:
            save_top_right_boxes(image_path, save_dir, detections)
            logger.debug(f"[{request_id}] Cropping completed")
        except ValueError as e:
            if "No boxes detected" in str(e) or "Not enough boxes" in str(e):
                logger.warning(f"[{request_id}] Invalid ID card photo: {e}")
                return {"error": "Invalid National ID Photo"}

        # Get paths to cropped images
        base_name = os.path.basename(image_path)
        firstname_img_path = os.path.join(save_dir, 'crops', '1', base_name)
        secondname_img_path = os.path.join(save_dir, 'crops', '2', base_name)
        location_img_path = os.path.join(save_dir, 'crops', '3', base_name)
        id_img_path = os.path.join(save_dir, 'crops', 'egyptian-id', base_name)

        # Check if files exist
        if not all(
                os.path.exists(p) for p in
            [firstname_img_path, secondname_img_path, location_img_path]):
            raise ValueError("Failed to extract all required fields from ID")

        # OCR processing
        logger.info(f"[{request_id}] Running PaddleOCR on text fields")
        ocr = get_ocr_model()

        first = ' '.join(
            reversed(ocr.predict(firstname_img_path)[0]['rec_texts']))
        logger.debug(f"[{request_id}] First name OCR finished")

        second = ' '.join(
            reversed(ocr.predict(secondname_img_path)[0]['rec_texts']))
        logger.debug(f"[{request_id}] Second name OCR: finished")

        loc = ' '.join(reversed(
            ocr.predict(location_img_path)[0]['rec_texts']))
        logger.debug(f"[{request_id}] Location OCR: finished")

        logger.info(f"[{request_id}] PaddleOCR completed")

        # Extract ID number if available
        id_number = ""
        if os.path.exists(id_img_path):
            logger.debug(f"[{request_id}] Extracting national ID number")
            id_number, _ = extract_digits_from_id(
                id_img_path, conf_threshold=ID_DIGIT_CONFIDENCE)
            logger.debug(
                f"[{request_id}] ID extraction completed, {id_number[:4]}****")

        logger.info(f"[{request_id}] ✓ Processing pipeline complete")

        return {
            "first_name": first,
            "second_name": second,
            "location": loc,
            "id_number": id_number
        }

    except Exception as e:
        logger.error(f"[{request_id}] ✗ Failed: {str(e)}", exc_info=True)
        return {"error": str(e)}

    finally:
        # Cleanup: remove all generated files and folders
        if save_dir and os.path.exists(save_dir):
            try:
                shutil.rmtree(save_dir)
                logger.debug(f"[{request_id}] Cleanup complete")
            except Exception as cleanup_error:
                logger.error(f"[{request_id}] Cleanup failed: {cleanup_error}")
