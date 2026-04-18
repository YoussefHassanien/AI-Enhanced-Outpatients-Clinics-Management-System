# Use NVIDIA CUDA base image for GPU support
FROM nvidia/cuda:12.2.2-cudnn8-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install Python, FFmpeg and other dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements first for better caching
COPY apps/asr/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r /app/requirements.txt

# Copy the rest of the ASR application
COPY apps/asr/ /app/

# Create logs, temp directories, AND a models directory
RUN mkdir -p /app/logs /app/temp_uploads /app/models

# Set environment variables for the application
# ADD HF_HOME so faster-whisper knows where to cache the 3GB model
ENV PYTHONPATH=/app \
    TEMP_DIR=/app/temp_uploads \
    LOG_DIR=/app/logs \
    HF_HOME=/app/models

# Command to run the consumer
CMD ["python3", "run_consumer.py"]
