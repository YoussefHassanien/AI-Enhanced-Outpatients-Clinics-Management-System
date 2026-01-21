# Egyptian ID OCR Microservice - Dockerfile

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install CPU-only PyTorch first (prevents CUDA dependencies)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src ./src
COPY run.py .
COPY .env .

# Copy model files
COPY models/Class_openvino_model ./models/Class_openvino_model
COPY models/ID_openvino_model ./models/ID_openvino_model

# Create logs directory (will be mounted as volume)
RUN mkdir -p /app/logs/ocr

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "run.py"]
