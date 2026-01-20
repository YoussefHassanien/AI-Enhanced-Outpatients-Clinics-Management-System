"""
Entry point for the OCR microservice.
This file serves as the main entry point that delegates to the FastAPI application.
"""

import uvicorn
from dotenv import load_dotenv

# Load environment configuration first
load_dotenv()

# Import app after loading env vars
from src.api.main import app

if __name__ == "__main__":
    # Run the FastAPI application
    # log_config=None tells uvicorn to use our custom logging config
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_config=None  # Disable uvicorn's default logging to use our custom logger
    )
