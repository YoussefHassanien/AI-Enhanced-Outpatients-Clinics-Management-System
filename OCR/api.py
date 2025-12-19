from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import cv2
import numpy as np
import os
import shutil
from datetime import datetime
import arabic_reshaper
from bidi.algorithm import get_display

# Import from EG_ID module
from EG_ID import (
    preload_models,
    predict_id,
    save_top_right_boxes,
    extract_digits_from_id,
    get_ocr_model,
    SCRIPT_DIR,
    RUNS_DIR
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, cleanup on shutdown"""
    print("Starting up - Loading models...")
    preload_models()
    print("Models loaded successfully!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="Egyptian ID OCR API",
    description="API for extracting information from Egyptian ID cards",
    version="1.0.0",
    lifespan=lifespan
)


def process_id_card(image_path: str):
    """
    Main processing function for ID card
    Returns extracted information as a dictionary
    """
    try:
        # Run YOLO detection
        results = predict_id(image_path)
        save_dir = results[0].save_dir if results else None
        
        if not save_dir:
            raise ValueError("Failed to process image")
        
        # Save cropped regions
        try:
            save_top_right_boxes(image_path, save_dir, results)
        except ValueError as e:
            if "No boxes detected" in str(e) or "Not enough boxes" in str(e):
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
        if not all(os.path.exists(p) for p in [firstname_img_path, secondname_img_path, location_img_path]):
            raise ValueError("Failed to extract all required fields from ID")
        
        # OCR processing
        ocr = get_ocr_model()
        first = ' '.join(reversed(ocr.predict(firstname_img_path)[0]['rec_texts']))
        second = ' '.join(reversed(ocr.predict(secondname_img_path)[0]['rec_texts']))
        loc = ' '.join(reversed(ocr.predict(location_img_path)[0]['rec_texts']))
        
        # Format Arabic text for display
        firstname_text = get_display(arabic_reshaper.reshape(first))
        secondname_text = get_display(arabic_reshaper.reshape(second))
        location_text = get_display(arabic_reshaper.reshape(loc))
        
        # Extract ID number if available
        id_number = ""
        if os.path.exists(id_img_path):
            id_number, _ = extract_digits_from_id(id_img_path, conf_threshold=0.25)
        
        return {
                "first_name": first,
                "second_name": second,
                "location": loc,
                "id_number": id_number
            }
        
    except Exception as e:
        return {
            "error": str(e),
            "status_code": 500
        }


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
    
    # Create temporary directory for uploads
    upload_dir = os.path.join(SCRIPT_DIR, 'temp_uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save uploaded file with timestamp to avoid conflicts
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    file_extension = os.path.splitext(file.filename)[1]
    temp_filename = f"id_{timestamp}{file_extension}"
    temp_path = os.path.join(upload_dir, temp_filename)
    
    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the ID card
        result = process_id_card(temp_path)
        
        # Return results
        if "error" in result:
            status_code = result.get("status_code", 500)
            raise HTTPException(status_code=status_code, detail=result["error"])
        else:
            return JSONResponse(
                status_code=200,
                content=result
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    
    finally:
        # Cleanup: remove temporary file
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except:
            pass


@app.post("/process-id-base64")
async def process_id_base64(image_data: dict):
    """
    Process an Egyptian ID card from base64 encoded image
    
    - **image_data**: Dictionary with 'image' key containing base64 encoded image string
    
    Returns extracted information
    """
    import base64
    
    if 'image' not in image_data:
        raise HTTPException(status_code=400, detail="Missing 'image' key in request body")
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data['image'])
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        # Save temporary file
        upload_dir = os.path.join(SCRIPT_DIR, 'temp_uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        temp_path = os.path.join(upload_dir, f"id_{timestamp}.jpg")
        cv2.imwrite(temp_path, img)
        
        # Process the ID card
        result = process_id_card(temp_path)
        
        # Cleanup
        try:
            os.remove(temp_path)
        except:
            pass
        
        # Return results
        if "error" in result:
            status_code = result.get("status_code", 500)
            raise HTTPException(status_code=status_code, detail=result["error"])
        else:
            return JSONResponse(status_code=200, content=result)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.get("/health")
async def health_check():
    """Detailed health check with model status"""
    from EG_ID import _CLASS_MODEL, _ID_MODEL, _OCR_MODEL
    
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
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
