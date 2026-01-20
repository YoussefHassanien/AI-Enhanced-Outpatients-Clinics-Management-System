# Egyptian ID OCR Microservice

Production-ready microservice for extracting information from Egyptian national ID cards.

## Features

- ✅ Concurrent request handling with isolated processing
- ✅ Environment-based configuration
- ✅ Structured logging (daily rotating files)
- ✅ OpenVINO optimized models
- ✅ Docker containerization
- ✅ Health check endpoints
- ✅ Clean src/ code organization

## File Structure

```
apps/ocr/
├── src/                        # Source code
│   ├── api/                    # FastAPI application
│   │   ├── __init__.py
│   │   └── main.py            # API endpoints and lifespan
│   ├── config/                 # Configuration modules
│   │   ├── __init__.py
│   │   └── logger.py          # Logging setup
│   └── core/                   # Core business logic
│       ├── __init__.py
│       └── ocr_processor.py   # OCR processing functions
├── models/                     # ML model files
│   ├── Class_openvino_model/  # Classification model
│   └── ID_openvino_model/     # ID digit detection model
├── run.py                      # Application entry point
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Container configuration
├── .env                        # Environment configuration
├── .env.example               # Example configuration
└── README.md

apps/logs/ocr/                  # Log files (daily rotation)
├── YYYY-MM-DD.log             # All logs
└── YYYY-MM-DD_errors.log      # Error logs only
```

## Quick Start

### Using Docker (Recommended)

```bash
# Build the container
docker build -t egyptian-id-ocr .

# Run the container with log volume
docker run -p 8000:8000 \
  -v $(pwd)/../logs/ocr:/app/logs/ocr \
  egyptian-id-ocr
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Run the service
python run.py
```

## Configuration

Edit `.env` file to configure the service:

```env
HOST=0.0.0.0
PORT=8000
USE_OPENVINO=true
CONFIDENCE_THRESHOLD=0.6
ID_DIGIT_CONFIDENCE=0.25
LOG_LEVEL=INFO
LOG_DIR=logs
IMAGE_SIZE=640
```

## API Endpoints

### POST /process-id
Upload an ID card image file

**Request:**
```bash
curl -X POST "http://localhost:8000/process-id" \
  -F "file=@id_card.jpg"
```

**Response:**
```json
{
  "first_name": "محمد",
  "second_name": "احمد",
  "location": "القاهرة",
  "id_number": "29501012345678"
}
```

### POST /process-id-base64
Process ID card from base64 encoded image

**Request:**
```bash
curl -X POST "http://localhost:8000/process-id-base64" \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_string"}'
```

### GET /health
Check service health

```bash
curl http://localhost:8000/health
```

## Logging

Logs are saved in `../logs/ocr/` directory (relative to apps/ocr/) with daily rotation:
- `YYYY-MM-DD.log` - All logs (INFO and above)
- `YYYY-MM-DD_errors.log` - Error logs only

The logging system automatically:
- Creates daily log files with timestamps
- Separates error logs from general logs
- Logs timing information for each processing step
- Includes unique request IDs for concurrent request tracking

## Production Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  ocr:
    build: ./apps/ocr
    ports:
      - "8000:8000"
    volumes:
      - ./apps/logs/ocr:/app/logs/ocr
    environment:
      - LOG_LEVEL=INFO
      - USE_OPENVINO=true
    restart: unless-stopped
```

### Kubernetes

See `k8s/` directory for Kubernetes deployment manifests.

## Performance

- **Average processing time**: 1-2 seconds per ID
- **Concurrent requests**: Fully supported with isolated processing
- **Model**: OpenVINO optimized for CPU inference

## Troubleshooting

**Models not found:**
Ensure OpenVINO models are in the correct directories:
- `egyId_weights_openvino_model/`
- `best_openvino_model/`

**High memory usage:**
Adjust `IMAGE_SIZE` in `.env` to a smaller value (e.g., 416)

**Slow processing:**
Set `USE_OPENVINO=false` to use PyTorch models if on GPU

## License

See LICENSE file in the root directory.
