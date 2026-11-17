# DemandIQ - Production Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install minimal build tools if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source code, pre-trained ML models, and data
COPY backend/ /app/backend/
COPY models/ /app/models/
COPY data/ /app/data/
COPY demandiq_processed_data.csv /app/demandiq_processed_data.csv
COPY model_comparison.csv /app/model_comparison.csv
COPY product_descriptions.json /app/product_descriptions.json

EXPOSE 8000

# Start Uvicorn server using dynamic port provided by hosting platforms (Render, Railway, Heroku)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
