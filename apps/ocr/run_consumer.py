"""
Entry point for RabbitMQ consumer mode.
This script starts the OCR service as a RabbitMQ consumer.
"""

import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.messaging.rabbitmq_consumer import main

if __name__ == "__main__":
    main()
