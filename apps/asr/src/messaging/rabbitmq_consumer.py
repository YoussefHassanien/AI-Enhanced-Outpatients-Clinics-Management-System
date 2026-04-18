"""
RabbitMQ Consumer for ASR (Speech-to-Text) Service
Queue: 'asr'
"""
import pika
import json
import base64
import os
import uuid
import shutil
from pathlib import Path
import threading
from concurrent.futures import ThreadPoolExecutor
from ..config import logger

# Import from core module
from src.core.asr_processor import preload_model, transcribe_audio


class ASRConsumer:

    def __init__(self):
        """Initialize RabbitMQ consumer for ASR"""
        self.rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
        self.rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
        self.rabbitmq_user = os.getenv('RABBITMQ_USER', 'guest')
        self.rabbitmq_password = os.getenv('RABBITMQ_PASSWORD', 'guest')
        self.rabbitmq_vhost = os.getenv('RABBITMQ_VHOST', '/')
        self.rabbitmq_queue = os.getenv('RABBIT_MQ_ASR_QUEUE', 'asr')

        self.queue_name = self.rabbitmq_queue
        self.connection = None
        self.channel = None

        self.temp_base_dir = Path(os.getenv('TEMP_DIR', '/app/temp_uploads'))
        self.temp_base_dir.mkdir(parents=True, exist_ok=True)
        
        # ENHANCEMENT: Thread pool to allow multiple files to hit the GPU concurrently
        max_workers = int(os.getenv('MAX_CONCURRENT_REQUESTS', '4'))
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

        logger.info(f"ASR Consumer initialized - {self.rabbitmq_host}:{self.rabbitmq_port}")

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
                blocked_connection_timeout=300)

            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            self.channel.queue_declare(queue=self.queue_name, durable=True)

            prefetch_count = int(os.getenv('RABBIT_MQ_PREFETCH_COUNT', '2'))
            self.channel.basic_qos(prefetch_count=prefetch_count)

            logger.info(f"✓ Connected to RabbitMQ at {self.rabbitmq_host}")
            logger.info(f"✓ Listening on queue: '{self.queue_name}'")

        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    def process_message(self, ch, method, properties, body):
        """
        Receives the message and instantly hands it to a background thread
        so the main RabbitMQ connection doesn't freeze.
        """
        self.executor.submit(self._threaded_processing, ch, method, properties, body)

    def _threaded_processing(self, ch, method, properties, body):
        """The actual heavy lifting done in the background"""
        request_id = str(uuid.uuid4())
        temp_dir = None

        try:
            message = json.loads(body)
            
            # Health check pattern
            pattern = message.get('pattern', {})
            if pattern == 'asr.isUp' or (isinstance(pattern, dict) and pattern.get('cmd') == 'asr.isUp'):
                logger.info(f"[{request_id}] Health check request received")
                self._schedule_response(properties, {"status": 200, "message": "ASR service is up"})
                self._schedule_ack(method.delivery_tag)
                return

            # Extract payload
            payload = message.get('data', message) if isinstance(message, dict) else message
            audio_base64 = payload.get('audio_base64')

            # 1. Grab the default from the .env file (defaulting to 1 if not found)
            env_default_beam = int(os.getenv('WHISPER_DEFAULT_BEAM_SIZE', '1'))
            
            # 2. Try to get 'beam_size' from the NestJS payload. If it's not there, use the .env default.
            beam_size = int(payload.get('beam_size', env_default_beam))

            if not audio_base64:
                raise ValueError("Missing audio data")

            # ENHANCEMENT: Strip frontend base64 prefix if it exists (e.g., 'data:audio/mp3;base64,...')
            if "," in audio_base64:
                audio_base64 = audio_base64.split(",")[1]

            audio_size_kb = len(audio_base64) * 3 / 4 / 1024
            logger.info(f"[{request_id}] Received transcription request (~{audio_size_kb:.1f} KB)")

            # Decode and save
            audio_bytes = base64.b64decode(audio_base64)
            temp_dir = self.temp_base_dir / request_id
            temp_dir.mkdir(parents=True, exist_ok=True)
            temp_audio_path = temp_dir / 'input_audio'
            
            with open(temp_audio_path, 'wb') as f:
                f.write(audio_bytes)

            # Process the audio (Heavy GPU Task)
            transcription = transcribe_audio(str(temp_audio_path), request_id, beam_size)

            # Send success response
            logger.info(f"[{request_id}] ✓ Transcription completed successfully")
            self._schedule_response(properties, {"transcription": transcription})

        except Exception as e:
            logger.error(f"[{request_id}] Error: {e}")
            self._schedule_error_response(properties, f"Transcription failed: {str(e)}")

        finally:
            # Always cleanup temporary files
            if temp_dir and temp_dir.exists():
                try:
                    shutil.rmtree(temp_dir)
                except Exception as cleanup_error:
                    logger.warning(f"[{request_id}] Cleanup failed: {cleanup_error}")
            
            # Acknowledge the message safely back on the main thread
            self._schedule_ack(method.delivery_tag)

    # --- THREAD-SAFE RABBITMQ HELPERS ---
    
    def _schedule_response(self, properties, data: dict):
        if properties.reply_to:
            cb = lambda: self.channel.basic_publish(
                exchange='',
                routing_key=properties.reply_to,
                body=json.dumps(data),
                properties=pika.BasicProperties(
                    correlation_id=properties.correlation_id,
                    content_type='application/json'
                )
            )
            self.connection.add_callback_threadsafe(cb)

    def _schedule_error_response(self, properties, error_message: str):
        if properties.reply_to:
            error_data = {"error": error_message, "status": 500}
            cb = lambda: self.channel.basic_publish(
                exchange='',
                routing_key=properties.reply_to,
                body=json.dumps(error_data),
                properties=pika.BasicProperties(
                    correlation_id=properties.correlation_id,
                    content_type='application/json'
                )
            )
            self.connection.add_callback_threadsafe(cb)

    def _schedule_ack(self, delivery_tag):
        self.connection.add_callback_threadsafe(lambda: self.channel.basic_ack(delivery_tag=delivery_tag))

    # ------------------------------------

    def start_consuming(self):
        try:
            logger.info("Starting ASR consumer...")
            if self.channel is None:
                raise RuntimeError("Channel is not initialized. Call connect() first.")
            self.channel.basic_consume(
                queue=self.queue_name,
                on_message_callback=self.process_message)

            logger.info("✓ ASR Consumer running. Waiting for audio...")
            self.channel.start_consuming()

        except Exception as e:
            logger.error(f"Error during consumption: {e}")
            raise


def main():
    from dotenv import load_dotenv
    load_dotenv()

    logger.info("=" * 60)
    logger.info("ASR Transcription Service - Starting")
    logger.info("=" * 60)

    try:
        preload_model()
    except Exception as e:
        logger.error(f"Failed to preload model: {e}")
    
    consumer = ASRConsumer()
    consumer.connect()
    logger.info("✓ ASR Service is ready to accept requests")
    try:
        consumer.start_consuming()
    except KeyboardInterrupt:
        logger.info("Shutting down worker...")
        consumer.executor.shutdown(wait=True)