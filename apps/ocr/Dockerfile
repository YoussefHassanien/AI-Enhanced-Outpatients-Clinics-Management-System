# Egyptian ID OCR Microservice - Dockerfile
# OpenVINO-based inference with PaddleOCR for Arabic text recognition

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and OpenVINO
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies (no PyTorch needed - using OpenVINO directly)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src ./src
COPY run_consumer.py .

# Copy model files
COPY models ./models

# Create logs directory (will be mounted as volume)
RUN mkdir -p /app/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
