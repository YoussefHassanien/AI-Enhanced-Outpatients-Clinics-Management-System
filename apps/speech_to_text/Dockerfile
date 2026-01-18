FROM python:3.11-slim

WORKDIR /asr_app

# Install system dependencies (git & ffmpeg) in a single layer to save space
# 'rm -rf' cleans up the apt cache to reduce image size
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only PyTorch first (Prevents downloading 4GB+ of Nvidia drivers)
# Install Whisper
# Using --no-cache-dir prevents caching issues and saves space
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "git+https://github.com/openai/whisper.git"



# PRELOAD WHISPER MODEL (BEST PRACTICE)
RUN python - <<EOF
import whisper
whisper.load_model("medium")
EOF

COPY . .

EXPOSE 8000

CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "8000"]
