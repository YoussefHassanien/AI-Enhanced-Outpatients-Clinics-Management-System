"""
RabbitMQ Consumer for Egyptian ID OCR Service
Single-purpose: Process Egyptian ID front photos and extract information
Queue: 'ocr'
"""
import pika
import json
import base64
import os
import logging
from pathlib import Path
import uuid
import shutil
from ..config import logger

# Import from core module
from src.core.ocr_processor import preload_models, process_id_card


class OCRConsumer:

    def __init__(self):
        """Initialize RabbitMQ consumer for Egyptian ID OCR"""
        # Get RabbitMQ configuration from environment
        self.rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
        self.rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
        self.rabbitmq_user = os.getenv('RABBITMQ_USER', 'guest')
        self.rabbitmq_password = os.getenv('RABBITMQ_PASSWORD', 'guest')
        self.rabbitmq_vhost = os.getenv('RABBITMQ_VHOST', '/')
        self.rabbitmq_queue = os.getenv('RABBIT_MQ_OCR_QUEUE', 'ocr')

        # Single queue for OCR requests
        self.queue_name = self.rabbitmq_queue

        # Connection and channel (initialized on connect)
        self.connection = None
        self.channel = None

        # Temporary directory for processing
        self.temp_base_dir = Path(os.getenv('TEMP_DIR', '/app/temp_uploads'))
        self.temp_base_dir.mkdir(parents=True, exist_ok=True)

        logger.info(
            f"Egyptian ID OCR Consumer initialized - {self.rabbitmq_host}:{self.rabbitmq_port}"
        )

    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            credentials = pika.PlainCredentials(self.rabbitmq_user,
                                                self.rabbitmq_password)
            parameters = pika.ConnectionParameters(
                host=self.rabbitmq_host,
                port=self.rabbitmq_port,
                virtual_host=self.rabbitmq_vhost,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300)

            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            # Declare single OCR queue (idempotent)
            self.channel.queue_declare(queue=self.queue_name, durable=True)

            # Process one message at a time (important for resource-limited environments)
            self.channel.basic_qos(prefetch_count=1)

            logger.info(f"✓ Connected to RabbitMQ at {self.rabbitmq_host}")
            logger.info(f"✓ Listening on queue: '{self.queue_name}'")

        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    def process_message(self, ch, method, properties, body):
        """
        Process incoming messages - either health check or ID photo processing
        
        Expected message format from NestJS (JSON):
        {
            "pattern": "ocr.isUp" or {},
            "data": {
                "image_base64": "base64-encoded-egyptian-id-front-photo"
            },
            "id": "correlation-id"
        }
        
        Or simple format (JSON):
        {
            "image_base64": "base64-encoded-egyptian-id-front-photo"
        }
        
        Response format:
        Success: {
            "firstName": "محمد",
            "lastName": "أحمد علي",
            "location": "القاهرة",
            "socialSecurityNumber": "29901011234567"
        }
        
        Error: {
            "error": "Invalid ID photo"
        }
        """
        request_id = str(uuid.uuid4())
        temp_dir = None

        try:
            # Parse message
            try:
                message = json.loads(body)
            except json.JSONDecodeError:
                logger.error(f"[{request_id}] Invalid JSON message")
                self._send_error_response(ch, properties, "Invalid ID photo")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Check for health check pattern (isUp)
            pattern = message.get('pattern', {})
            if pattern == 'ocr.isUp' or (isinstance(pattern, dict)
                                         and pattern.get('cmd') == 'ocr.isUp'):
                logger.info(f"[{request_id}] Health check request received")
                self._send_response(ch, properties,
                                    {"status": "OCR Service is running"})
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Handle NestJS microservices message format
            # NestJS wraps the payload in a 'data' field
            if 'data' in message and isinstance(message['data'], dict):
                payload = message['data']
                logger.debug(
                    f"[{request_id}] Extracted payload from NestJS format")
            else:
                payload = message

            image_base64 = payload.get('image_base64')

            if not image_base64:
                logger.error(f"[{request_id}] Missing image_base64 in message")
                self._send_error_response(ch, properties, "Invalid ID photo")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Log image size
            image_size_kb = len(
                image_base64) * 3 / 4 / 1024  # Approximate decoded size
            logger.info(
                f"[{request_id}] Received Egyptian ID photo request (~{image_size_kb:.1f} KB)"
            )

            # Decode base64 image
            try:
                image_bytes = base64.b64decode(image_base64)
                logger.debug(
                    f"[{request_id}] Base64 decoded, ({len(image_bytes)} bytes)"
                )
            except Exception as e:
                logger.error(f"[{request_id}] Failed to decode base64: {e}")
                self._send_error_response(ch, properties, "Invalid ID photo")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Create temporary directory for this request
            temp_dir = self.temp_base_dir / request_id
            temp_dir.mkdir(parents=True, exist_ok=True)

            # Save image temporarily
            temp_image_path = temp_dir / 'id_card.jpg'
            with open(temp_image_path, 'wb') as f:
                f.write(image_bytes)
            logger.debug(
                f"[{request_id}] Image saved to temp: {temp_image_path}")

            logger.info(f"[{request_id}] Processing Egyptian ID card...")

            # Process the ID card
            result = process_id_card(str(temp_image_path), request_id)

            # Check for errors in processing
            if "error" in result:
                logger.warning(
                    f"[{request_id}] Processing failed: {result['error']}")
                self._send_error_response(ch, properties, "Invalid ID photo")
            else:
                # Transform to standardized response format
                response = {
                    "firstName": result.get("first_name", ""),
                    "lastName": result.get("second_name", ""),
                    "location": result.get("location", ""),
                    "socialSecurityNumber": result.get("id_number", "")
                }

                logger.info(f"[{request_id}] ✓ Completed")
                logger.info(f"[{request_id}] Extracted all data successfully")

                # Send success response
                self._send_response(ch, properties, response)

            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            logger.error(f"[{request_id}] Unexpected error: {e}",
                         exc_info=True)
            self._send_error_response(ch, properties, "Invalid ID photo")
            ch.basic_ack(delivery_tag=method.delivery_tag)

        finally:
            # Always cleanup temporary files
            if temp_dir and temp_dir.exists():
                try:
                    shutil.rmtree(temp_dir)
                    logger.debug(f"[{request_id}] Cleanup complete")
                except Exception as cleanup_error:
                    logger.warning(
                        f"[{request_id}] Cleanup failed: {cleanup_error}")

    def _send_response(self, ch, properties, data: dict):
        """Send success response back to client"""
        if not properties.reply_to:
            logger.warning("No reply_to queue specified, skipping response")
            return

        try:
            ch.basic_publish(exchange='',
                             routing_key=properties.reply_to,
                             body=json.dumps(data),
                             properties=pika.BasicProperties(
                                 correlation_id=properties.correlation_id,
                                 content_type='application/json'))
        except Exception as e:
            logger.error(f"Failed to send response: {e}")

    def _send_error_response(self, ch, properties, error_message: str):
        """Send error response back to client"""
        if not properties.reply_to:
            logger.warning(
                "No reply_to queue specified, skipping error response")
            return

        try:
            ch.basic_publish(exchange='',
                             routing_key=properties.reply_to,
                             body=json.dumps({"error": error_message}),
                             properties=pika.BasicProperties(
                                 correlation_id=properties.correlation_id,
                                 content_type='application/json'))
        except Exception as e:
            logger.error(f"Failed to send error response: {e}")

    def start_consuming(self):
        """Start consuming messages from the OCR queue"""
        try:
            logger.info("Starting Egyptian ID OCR consumer...")
            if self.channel is None:
                raise RuntimeError(
                    "Channel is not initialized. Call connect() first.")
            self.channel.basic_consume(
                queue=self.queue_name,
                on_message_callback=self.process_message)

            logger.info(
                "✓ OCR Consumer running. Waiting for Egyptian ID photos...")
            self.channel.start_consuming()

        except Exception as e:
            logger.error(f"Error during consumption: {e}")
            raise


def main():
    """Main entry point for Egyptian ID OCR RabbitMQ consumer"""
    from src.config.logger import logger as configured_logger

    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    configured_logger.info("=" * 60)
    configured_logger.info("Egyptian ID OCR Consumer - Starting")
    configured_logger.info("Queue: 'ocr'")
    configured_logger.info("=" * 60)

    # Preload ML models before starting consumer
    configured_logger.info("Preloading OCR models...")
    preload_models()
    configured_logger.info(f"✓ Models loaded successfully")

    configured_logger.info("✓ Service started")

    # Create and start consumer
    consumer = OCRConsumer()
    consumer.connect()
    configured_logger.info("✓ OCR Service is ready to accept requests")
    consumer.start_consuming()
