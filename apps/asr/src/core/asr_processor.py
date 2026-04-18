import os
from xml.parsers.expat import model
import ffmpeg
import shutil
from faster_whisper import WhisperModel
from ..config import logger

# Configuration from environment
MODEL_SIZE = os.getenv('WHISPER_MODEL_SIZE', 'large-v3')
# In docker, we can specify if we want to force CPU or use CUDA
# By default, we'll try to use CUDA if available
DEVICE = os.getenv('WHISPER_DEVICE', 'auto')
# compute_type can be "int8", "float16", "bfloat16", "float32"
# float16 is recommended for GPU, int8 for CPU
COMPUTE_TYPE = os.getenv('WHISPER_COMPUTE_TYPE', 'default')

# Global model instance (singleton)
_MODEL = None

def get_model():
    """Lazy load Whisper model"""
    global _MODEL
    if _MODEL is None:
        try:
            logger.info(f"Loading Whisper model '{MODEL_SIZE}' (device={DEVICE}, compute_type={COMPUTE_TYPE})...")
            
            # If COMPUTE_TYPE is 'default', we'll let faster-whisper decide based on device
            if COMPUTE_TYPE == 'default':
                _MODEL = WhisperModel(MODEL_SIZE, device=DEVICE)
            else:
                _MODEL = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
                
            logger.info(f"✓ Whisper model loaded successfully on device: {_MODEL.model.device}")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    return _MODEL

def preload_model():
    """Preload model at startup"""
    get_model()

def preprocess_audio(input_path: str, output_path: str):
    """
    Convert input audio to 16kHz mono WAV for optimal Whisper inference
    """
    try:
        logger.debug(f"Preprocessing audio: {input_path} -> {output_path}")
        # -y: overwrite output
        # -ac 1: mono
        # -ar 16000: 16kHz sample rate
        # -f wav: output format
        stream = ffmpeg.input(input_path)
        stream = ffmpeg.output(stream, output_path, ac=1, ar=16000)
        ffmpeg.run(stream, overwrite_output=True, quiet=True)
        return True
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg preprocessing failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during preprocessing: {e}")
        return False

def transcribe_audio(audio_path: str, request_id: str = "default", beam_size: int = 1): 
    """
    Process audio and return transcription
    """
    model = get_model()
    
    # Create a temporary path for the processed WAV file
    processed_wav_path = f"{audio_path}_{request_id}_processed.wav"
    
    try:
        # Preprocess to 16kHz mono WAV
        if not preprocess_audio(audio_path, processed_wav_path):
            raise RuntimeError("Audio preprocessing failed")
        
        logger.info(f"[{request_id}] Starting transcription...")
        
        # Run transcription
        # beam_size=5 is a good balance between speed and accuracy
        # word_timestamps=False to keep it faster and simpler
        segments, info = model.transcribe(processed_wav_path, beam_size=beam_size)        
        # Combine segments into a single string
        transcription_parts = []
        for segment in segments:
            transcription_parts.append(segment.text)
            
        full_text = "".join(transcription_parts).strip()
        
        # Get the actual device the model is currently sitting on
        active_device = model.model.device
        logger.info(f"[{request_id}] ✓ Transcription completed on {active_device}. Beam size: {beam_size}. Length: {len(full_text)} characters.")
        print(f"[{request_id}] ✓ Transcription completed on {active_device}. Beam size: {beam_size}. Length: {len(full_text)} characters.")
        return full_text
        
    except Exception as e:
        logger.error(f"[{request_id}] Transcription failed: {e}")
        raise
    finally:
        # Clean up the temporary processed WAV file
        if os.path.exists(processed_wav_path):
            try:
                os.remove(processed_wav_path)
                logger.debug(f"[{request_id}] Cleaned up processed WAV: {processed_wav_path}")
            except Exception as e:
                logger.warning(f"[{request_id}] Failed to cleanup processed WAV: {e}")
