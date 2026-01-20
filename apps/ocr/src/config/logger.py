"""
Logging configuration for Egyptian ID OCR service
"""
import os
import logging
from datetime import datetime
from pathlib import Path

def setup_logging():
    """
    Setup logging with daily rotating files
    Creates two files per day: normal logs and error logs
    """
    # Get log directory from environment or use default
    log_dir = os.getenv('LOG_DIR', '../logs/ocr')
    
    # Resolve log path relative to the ocr/ root directory (3 levels up from this file)
    ocr_root = Path(__file__).resolve().parent.parent.parent
    log_path = (ocr_root / log_dir).resolve()
    log_path.mkdir(parents=True, exist_ok=True)
    
    # Get current date for filename
    today = datetime.now().strftime('%Y-%m-%d')
    
    # File paths
    info_log_file = log_path / f"{today}.log"
    error_log_file = log_path / f"{today}_errors.log"
    
    # Get log level from environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(console_handler)
    
    # Info file handler (all logs)
    info_handler = logging.FileHandler(info_log_file, encoding='utf-8')
    info_handler.setLevel(logging.INFO)
    info_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(info_handler)
    
    # Error file handler (errors only)
    error_handler = logging.FileHandler(error_log_file, encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(error_handler)
    
    # Configure uvicorn loggers to use our handlers
    for logger_name in ['uvicorn', 'uvicorn.access', 'uvicorn.error']:
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.handlers = root_logger.handlers.copy()
        uvicorn_logger.setLevel(logging.INFO)
        uvicorn_logger.propagate = False  # Don't propagate to root logger
    
    return root_logger

# Initialize logger
logger = setup_logging()
