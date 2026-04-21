# Egyptian ID OCR Microservice - Dockerfile
# GPU-accelerated inference with PaddleOCR for Arabic text recognition

FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu22.04

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install Python 3.11 and system dependencies for OpenCV / OpenVINO
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY ./apps/ocr/requirements.txt .

# Install PaddlePaddle GPU (from Paddle's own CUDA 12.6 index)
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir paddlepaddle-gpu==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/

# Install remaining Python dependencies
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./apps/ocr/src ./src
COPY ./apps/ocr/run_consumer.py .

# Copy model files
COPY ./apps/ocr/models ./models

# Create logs directory (will be mounted as volume)
RUN mkdir -p /app/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
