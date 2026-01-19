# Egyptian ID OCR FastAPI

API for extracting information from Egyptian ID cards using YOLO and PaddleOCR.

## Installation

```bash
pip install -r requirements.txt
```

## Running the API

```bash
# Development
python api.py

# Or with uvicorn directly
uvicorn api:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### 1. Health Check
```bash
GET /
GET /health
```

### 2. Process ID Card (File Upload)
```bash
POST /process-id
Content-Type: multipart/form-data

# Using curl
curl -X POST "http://localhost:8000/process-id" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/id_card.jpg"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "first_name": "محمد",
    "second_name": "أحمد",
    "location": "القاهرة",
    "id_number": "29012345678901"
  },
  "raw_data": {
    "first_name_raw": "محمد",
    "second_name_raw": "أحمد",
    "location_raw": "القاهرة"
  }
}
```

### 3. Process ID Card (Base64)
```bash
POST /process-id-base64
Content-Type: application/json

{
  "image": "base64_encoded_image_string"
}
```

## Usage Examples

### Python Client
```python
import requests

# Upload file
url = "http://localhost:8000/process-id"
files = {"file": open("id_card.jpg", "rb")}
response = requests.post(url, files=files)
print(response.json())

# Base64
import base64
with open("id_card.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

response = requests.post(
    "http://localhost:8000/process-id-base64",
    json={"image": image_b64}
)
print(response.json())
```

### JavaScript (Fetch API)
```javascript
// File upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/process-id', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Interactive Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Performance Notes

- Models are loaded once at startup and cached in memory
- First request may take a few seconds for model warmup
- Subsequent requests are much faster (~1-2 seconds per ID)
- For production, consider using multiple workers with `--workers N`

## Docker Deployment (Optional)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t egyptian-id-ocr .
docker run -p 8000:8000 egyptian-id-ocr
```
