FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu22.04

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility

WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && apt-get install -y --no-install-recommends \
        software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y --no-install-recommends \
        python3.11 \
        python3.11-venv \
        python3.11-dev \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
    && python3.11 -m ensurepip --upgrade \
    && rm -rf /var/lib/apt/lists/*

COPY ./apps/ocr/requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip \
    && python -m pip install paddlepaddle-gpu==3.2.0 \
        -i https://www.paddlepaddle.org.cn/packages/stable/cu126/ \
    && python -m pip install -r requirements.txt

COPY ./apps/ocr/src ./src
COPY ./apps/ocr/run_consumer.py .
# Consider mounting models as a volume instead:
# COPY ./apps/ocr/models ./models

RUN useradd -m -u 1001 appuser \
    && mkdir -p /app/logs \
    && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import sys; sys.exit(0)"

CMD ["python", "run_consumer.py"]