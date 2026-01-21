"""
RabbitMQ Consumer for OCR Service
Listens to ocr_requests queue and processes ID cards
"""
import pika
import json
import base64
import os
import logging
from pathlib import Path
import uuid
import time

logger = logging.getLogger(__name__)

# Import from core module
from src.core.ocr_processor import preload_models
from src.api.main import process_id_card

class OCRConsumer:
    def __init__(self):
        """Initialize RabbitMQ consumer"""
        # Get RabbitMQ configuration from environment (required)
        self.rabbitmq_host = os.getenv('RABBITMQ_HOST')
        self.rabbitmq_port = int(os.getenv('RABBITMQ_PORT'))
        self.rabbitmq_user = os.getenv('RABBITMQ_USER')
        self.rabbitmq_password = os.getenv('RABBITMQ_PASSWORD')
        self.rabbitmq_vhost = os.getenv('RABBITMQ_VHOST')
        
        # Queue names
        self.request_queue = os.getenv('OCR_REQUEST_QUEUE')
        self.response_queue = os.getenv('OCR_RESPONSE_QUEUE')
        
        # Validate required environment variables
        required_vars = {
            'RABBITMQ_HOST': self.rabbitmq_host,
            'RABBITMQ_PORT': self.rabbitmq_port,
            'RABBITMQ_USER': self.rabbitmq_user,
            'RABBITMQ_PASSWORD': self.rabbitmq_password,
            'RABBITMQ_VHOST': self.rabbitmq_vhost,
            'OCR_REQUEST_QUEUE': self.request_queue,
            'OCR_RESPONSE_QUEUE': self.response_queue
        }
        
        missing = [var for var, value in required_vars.items() if not value]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        # Connection and channel (initialized on connect)
        self.connection = None
        self.channel = None
        
        logger.info(f"OCR Consumer initialized for {self.rabbitmq_host}:{self.rabbitmq_port}")
        
    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            credentials = pika.PlainCredentials(self.rabbitmq_user, self.rabbitmq_password)
            parameters = pika.ConnectionParameters(
                host=self.rabbitmq_host,
                port=self.rabbitmq_port,
                virtual_host=self.rabbitmq_vhost,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare queues (idempotent - safe if already exists)
            self.channel.queue_declare(queue=self.request_queue, durable=True)
            self.channel.queue_declare(queue=self.response_queue, durable=True)
            
            # Set QoS to process one message at a time
            self.channel.basic_qos(prefetch_count=1)
            
            logger.info(f"Connected to RabbitMQ at {self.rabbitmq_host}")
            logger.info(f"Listening on queue: {self.request_queue}")
            logger.info(f"Publishing to queue: {self.response_queue}")
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def process_message(self, ch, method, properties, body):
        """
        Process incoming OCR request message
        
        Expected message format (JSON):
        {
            "request_id": "unique-id",
            "image_base64": "base64-encoded-image-data"
        }
        """
        request_id = None
        start_time = time.time()
        
        try:
            # Parse message
            message = json.loads(body)
            request_id = message.get('request_id', str(uuid.uuid4()))
            image_base64 = message.get('image_base64')
            
            logger.info(f"[{request_id}] Received OCR request")
            
            if not image_base64:
                raise ValueError("Missing image_base64 in message")
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_base64)
            
            # Create temporary directory for this request
            temp_dir = Path(os.getenv('SCRIPT_DIR', '/app')) / 'temp_uploads' / request_id
            temp_dir.mkdir(parents=True, exist_ok=True)
            
            # Save image temporarily
            temp_image_path = temp_dir / 'id_card.jpg'
            with open(temp_image_path, 'wb') as f:
                f.write(image_bytes)
            
            logger.info(f"[{request_id}] Processing ID card image")
            
            # Process the ID card
            result = process_id_card(str(temp_image_path), request_id)
            
            # Check if processing was successful
            if "error" in result:
                response = {
                    "request_id": request_id,
                    "status": "error",
                    "error": result["error"],
                    "processing_time": time.time() - start_time
                }
                logger.error(f"[{request_id}] Processing failed: {result['error']}")
            else:
                response = {
                    "request_id": request_id,
                    "status": "success",
                    "data": result,
                    "processing_time": time.time() - start_time
                }
                logger.info(f"[{request_id}] Processing completed in {response['processing_time']:.2f}s")
            
            # Publish response to response queue
            self.channel.basic_publish(
                exchange='',
                routing_key=self.response_queue,
                body=json.dumps(response),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    correlation_id=request_id
                )
            )
            
            logger.info(f"[{request_id}] Response published to {self.response_queue}")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
            # Cleanup temporary files
            try:
                import shutil
                if temp_dir.exists():
                    shutil.rmtree(temp_dir)
            except Exception as cleanup_error:
                logger.warning(f"[{request_id}] Cleanup failed: {cleanup_error}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
        except Exception as e:
            logger.error(f"[{request_id}] Error processing message: {e}", exc_info=True)
            
            # Send error response
            if request_id:
                error_response = {
                    "request_id": request_id,
                    "status": "error",
                    "error": str(e),
                    "processing_time": time.time() - start_time
                }
                try:
                    self.channel.basic_publish(
                        exchange='',
                        routing_key=self.response_queue,
                        body=json.dumps(error_response),
                        properties=pika.BasicProperties(
                            delivery_mode=2,
                            correlation_id=request_id
                        )
                    )
                except:
                    pass
            
            # Negative acknowledge - don't requeue (avoid infinite loops)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    def start_consuming(self):
        """Start consuming messages from the queue"""
        try:
            logger.info("Starting to consume messages...")
            self.channel.basic_consume(
                queue=self.request_queue,
                on_message_callback=self.process_message
            )
            
            logger.info("✓ OCR Consumer is running. Waiting for messages...")
            self.channel.start_consuming()
            
        except KeyboardInterrupt:
            logger.info("Consumer stopped by user")
            self.stop()
        except Exception as e:
            logger.error(f"Error during consumption: {e}")
            raise
    
    def stop(self):
        """Stop consuming and close connection"""
        try:
            if self.channel and self.channel.is_open:
                self.channel.stop_consuming()
                self.channel.close()
            if self.connection and self.connection.is_open:
                self.connection.close()
            logger.info("RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"Error closing connection: {e}")


def main():
    """Main entry point for RabbitMQ consumer"""
    from src.config.logger import logger as configured_logger
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Preload ML models before starting consumer
    configured_logger.info("Preloading OCR models...")
    preload_models()
    configured_logger.info("Models loaded successfully")
    
    # Create and start consumer
    consumer = OCRConsumer()
    consumer.connect()
    consumer.start_consuming()


if __name__ == "__main__":
    main()
