import os
import sys
from pathlib import Path

# Add parent directory to path for imports
ROOT_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import cv2
import numpy as np
import shutil
import uuid
import time
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging before importing other modules
from src.config.logger import logger

# Import from core module
from src.core.ocr_processor import (
    preload_models, predict_id, save_top_right_boxes,
    extract_digits_from_id, get_ocr_model, SCRIPT_DIR, RUNS_DIR, ID_DIGIT_CONFIDENCE
)
import arabic_reshaper
from bidi.algorithm import get_display


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, cleanup on shutdown"""
    logger.info("Starting Egyptian ID OCR Service...")
    preload_models()
    logger.info("Service ready to handle requests")
    yield
    logger.info("Shutting down service")


app = FastAPI(
    title="Egyptian ID OCR API",
    description="API for extracting information from Egyptian ID cards",
    version="1.0.0",
    lifespan=lifespan)


def process_id_card(image_path: str, request_id: str):
    """
    Main processing function for ID card
    Returns extracted information as a dictionary
    
    Args:
        image_path: Path to the uploaded image
        request_id: Unique identifier for this request (for isolated folders)
    """
    save_dir = None
    start_total = time.time()
    timings = {}
    
    try:
        # Run YOLO detection with unique request ID
        logger.info(f"[{request_id}] Starting YOLO detection")
        start = time.time()
        results = predict_id(image_path, request_id)
        save_dir = results[0].save_dir if results else None
        timings['yolo_detection'] = time.time() - start
        logger.info(f"[{request_id}] YOLO detection: {timings['yolo_detection']:.3f}s")

        if not save_dir:
            raise ValueError("Failed to process image")

        # Save cropped regions
        logger.debug(f"[{request_id}] Cropping regions")
        start = time.time()
        try:
            save_top_right_boxes(image_path, save_dir, results)
            timings['cropping'] = time.time() - start
            logger.debug(f"[{request_id}] Cropping: {timings['cropping']:.3f}s")
        except ValueError as e:
            if "No boxes detected" in str(e) or "Not enough boxes" in str(e):
                logger.warning(f"[{request_id}] Invalid ID card photo: {e}")
                return {
                    "error": "Invalid National ID Photo",
                    "status_code": 400
                }
            raise

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
        logger.info(f"[{request_id}] Running OCR on text fields")
        start = time.time()
        ocr = get_ocr_model()
        
        first = ' '.join(
            reversed(ocr.predict(firstname_img_path)[0]['rec_texts']))
        second = ' '.join(
            reversed(ocr.predict(secondname_img_path)[0]['rec_texts']))
        loc = ' '.join(reversed(
            ocr.predict(location_img_path)[0]['rec_texts']))
        
        timings['ocr_total'] = time.time() - start
        logger.info(f"[{request_id}] OCR: {timings['ocr_total']:.3f}s")

        # Format Arabic text for display
        firstname_text = get_display(arabic_reshaper.reshape(first))
        secondname_text = get_display(arabic_reshaper.reshape(second))
        location_text = get_display(arabic_reshaper.reshape(loc))

        # Extract ID number if available
        id_number = ""
        if os.path.exists(id_img_path):
            logger.debug(f"[{request_id}] Extracting ID number")
            start = time.time()
            id_number, _ = extract_digits_from_id(id_img_path,
                                                  conf_threshold=ID_DIGIT_CONFIDENCE)
            timings['id_extraction'] = time.time() - start
            logger.debug(f"[{request_id}] ID extraction: {timings['id_extraction']:.3f}s")
        
        timings['total_processing'] = time.time() - start_total
        logger.info(f"[{request_id}] ✓ Total: {timings['total_processing']:.3f}s")

        return {
            "first_name": first,
            "second_name": second,
            "location": loc,
            "id_number": id_number
        }

    except Exception as e:
        timings['total_processing'] = time.time() - start_total
        logger.error(f"[{request_id}] ✗ Failed after {timings['total_processing']:.3f}s: {str(e)}", exc_info=True)
        return {"error": str(e), "status_code": 500}
    
    finally:
        # Cleanup: remove all generated files and folders
        if save_dir and os.path.exists(save_dir):
            start = time.time()
            try:
                shutil.rmtree(save_dir)
                cleanup_time = time.time() - start
                logger.debug(f"[{request_id}] Cleanup: {cleanup_time:.3f}s")
            except Exception as cleanup_error:
                logger.error(f"[{request_id}] Cleanup failed: {cleanup_error}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Egyptian ID OCR API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.post("/process-id")
async def process_id_endpoint(file: UploadFile = File(...)):
    """
    Process an Egyptian ID card image
    
    - **file**: ID card image file (jpg, jpeg, png)
    
    Returns extracted information including:
    - First name
    - Second name
    - Location
    - ID number
    """

    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique request ID for isolation
    request_id = str(uuid.uuid4())
    
    # Create request-specific temporary directory
    upload_dir = os.path.join(SCRIPT_DIR, 'temp_uploads', request_id)
    os.makedirs(upload_dir, exist_ok=True)

    # Save uploaded file
    file_extension = os.path.splitext(file.filename)[1]
    temp_filename = f"id{file_extension}"
    temp_path = os.path.join(upload_dir, temp_filename)

    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process the ID card with unique request ID
        result = process_id_card(temp_path, request_id)

        # Return results
        if "error" in result:
            status_code = result.get("status_code", 500)
            raise HTTPException(status_code=status_code,
                                detail=result["error"])
        else:
            return JSONResponse(status_code=200, content=result)

    except Exception as e:
        logger.error(f"[{request_id}] Processing error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500,
                            detail=f"Processing error: {str(e)}")

    finally:
        # Cleanup: remove request-specific temporary folder (safe for concurrent requests)
        try:
            if os.path.exists(upload_dir):
                shutil.rmtree(upload_dir)
        except Exception as e:
            logger.error(f"[{request_id}] Upload cleanup failed: {e}")
        
        # Cleanup request-specific runs folder
        request_runs_dir = os.path.join(SCRIPT_DIR, 'runs', request_id)
        try:
            if os.path.exists(request_runs_dir):
                shutil.rmtree(request_runs_dir)
        except Exception as e:
            logger.error(f"[{request_id}] Runs cleanup failed: {e}")


@app.post("/process-id-base64")
async def process_id_base64(image_data: dict):
    """
    Process an Egyptian ID card from base64 encoded image
    
    - **image_data**: Dictionary with 'image' key containing base64 encoded image string
    
    Returns extracted information
    """
    import base64

    if 'image' not in image_data:
        raise HTTPException(status_code=400,
                            detail="Missing 'image' key in request body")

    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data['image'])
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Failed to decode image")

        # Generate unique request ID for isolation
        request_id = str(uuid.uuid4())
        
        # Save temporary file in request-specific directory
        upload_dir = os.path.join(SCRIPT_DIR, 'temp_uploads', request_id)
        os.makedirs(upload_dir, exist_ok=True)

        temp_path = os.path.join(upload_dir, "id.jpg")
        cv2.imwrite(temp_path, img)

        # Process the ID card with unique request ID
        result = process_id_card(temp_path, request_id)

        # Cleanup request-specific temporary folder (safe for concurrent requests)
        try:
            if os.path.exists(upload_dir):
                shutil.rmtree(upload_dir)
        except Exception as e:
            logger.error(f"[{request_id}] Upload cleanup failed: {e}")
        
        # Cleanup request-specific runs folder
        request_runs_dir = os.path.join(SCRIPT_DIR, 'runs', request_id)
        try:
            if os.path.exists(request_runs_dir):
                shutil.rmtree(request_runs_dir)
        except Exception as e:
            logger.error(f"[{request_id}] Runs cleanup failed: {e}")

        # Return results
        if "error" in result:
            status_code = result.get("status_code", 500)
            raise HTTPException(status_code=status_code,
                                detail=result["error"])
        else:
            return JSONResponse(status_code=200, content=result)

    except Exception as e:
        logger.error(f"Base64 processing error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500,
                            detail=f"Processing error: {str(e)}")


@app.get("/health")
async def health_check():
    """Detailed health check with model status"""
    from src.core.ocr_processor import _CLASS_MODEL, _ID_MODEL, _OCR_MODEL

    return {
        "status": "healthy",
        "models_loaded": {
            "classification_model": _CLASS_MODEL is not None,
            "id_digit_model": _ID_MODEL is not None,
            "ocr_model": _OCR_MODEL is not None
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8000'))
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, reload=False)
