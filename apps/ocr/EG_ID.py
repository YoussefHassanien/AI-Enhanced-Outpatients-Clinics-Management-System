import cv2
from paddleocr import PaddleOCR
from ultralytics import YOLO
import os
import arabic_reshaper
from bidi.algorithm import get_display
import tkinter as tk
from tkinter import filedialog
import ctypes

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLASS_MODEL_PATH = os.path.join(SCRIPT_DIR, 'egyId_weights.pt')
ID_MODEL_PATH = os.path.join(SCRIPT_DIR, 'best.pt')
RUNS_DIR = os.path.join(SCRIPT_DIR, 'runs')

# Verify model files exist
if not os.path.exists(CLASS_MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at: {CLASS_MODEL_PATH}")
if not os.path.exists(ID_MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at: {ID_MODEL_PATH}")

# ===== MODEL INITIALIZATION =====
# Global models - loaded once and reused (singleton pattern for FastAPI)
_CLASS_MODEL = None
_ID_MODEL = None
_OCR_MODEL = None


def get_class_model():
    """Lazy load classification model (singleton pattern)"""
    global _CLASS_MODEL
    if _CLASS_MODEL is None:
        print("Loading classification model...")
        _CLASS_MODEL = YOLO(CLASS_MODEL_PATH)
    return _CLASS_MODEL


def get_id_model():
    """Lazy load ID digit detection model (singleton pattern)"""
    global _ID_MODEL
    if _ID_MODEL is None:
        print("Loading ID digit model...")
        _ID_MODEL = YOLO(ID_MODEL_PATH)
    return _ID_MODEL


def get_ocr_model():
    """Lazy load PaddleOCR model (singleton pattern)"""
    global _OCR_MODEL
    if _OCR_MODEL is None:
        print("Loading PaddleOCR model...")
        _OCR_MODEL = PaddleOCR(lang='ar',
                               use_doc_orientation_classify=False,
                               use_doc_unwarping=False,
                               use_textline_orientation=False)
    return _OCR_MODEL


def preload_models():
    """Preload all models at startup (for FastAPI lifespan)"""
    get_class_model()
    get_id_model()
    get_ocr_model()
    print("All models loaded successfully!")


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


def select_image_file():
    """Open a high-quality file dialog to select an image file."""
    # Enable DPI awareness for crisp dialog on high-DPI displays
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except:
        pass

    # Create root window and hide it
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)

    # Open file dialog
    file_path = filedialog.askopenfilename(
        title="Select ID Card Image",
        filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp *.tiff *.tif"),
                   ("JPEG files", "*.jpg *.jpeg"), ("PNG files", "*.png"),
                   ("All files", "*.*")],
        initialdir=os.path.expanduser("~"))

    # Cleanup
    root.destroy()

    return file_path if file_path else None


def predict_id(path):
    model = get_class_model()
    # Set project directory to OCR/runs
    results = model(path,
                    save=True,
                    conf=0.6,
                    imgsz=640,
                    show=False,
                    save_crop=True,
                    project=RUNS_DIR,
                    name='detect')
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


def main():
    """Main function for standalone execution (not used by API)"""
    path = select_image_file()
    if path:
        results = predict_id(path)
        save_dir = results[0].save_dir if results else None
        save_top_right_boxes(path, save_dir, results)

        # Load the cropped images
        firstname_img_path = os.path.join(save_dir, 'crops', '1',
                                          os.path.basename(path))
        secondname_img_path = os.path.join(save_dir, 'crops', '2',
                                           os.path.basename(path))
        location_img_path = os.path.join(save_dir, 'crops', '3',
                                         os.path.basename(path))

        # Read images and apply preprocessing
        firstname_img = cv2.imread(firstname_img_path)
        secondname_img = cv2.imread(secondname_img_path)
        location_img = cv2.imread(location_img_path)

        ocr = get_ocr_model()
        first = ' '.join(
            reversed(ocr.predict(firstname_img_path)[0]['rec_texts']))
        second = ' '.join(
            reversed(ocr.predict(secondname_img_path)[0]['rec_texts']))
        loc = ' '.join(reversed(
            ocr.predict(location_img_path)[0]['rec_texts']))

        firstname_text = get_display(arabic_reshaper.reshape(first))
        secondname_text = get_display(arabic_reshaper.reshape(second))
        location_text = get_display(arabic_reshaper.reshape(loc))
        print("First Name:", firstname_text)
        print("Second Name:", secondname_text)
        print("Location:", location_text)

        numbers, detections = extract_digits_from_id(os.path.join(
            save_dir, 'crops', 'egyptian-id', os.path.basename(path)),
                                                     conf_threshold=0.25)
        print("ID Number:", numbers)


# Only run main() if this script is executed directly, not when imported by API
if __name__ == "__main__":
    main()
