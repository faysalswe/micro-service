FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create non-root user (UID 1001)
RUN groupadd -r appgroup && useradd -r -u 1001 -g appgroup appuser \
    && chown -R appuser:appgroup /app
USER 1001

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5014
ENV PYTHONPATH=/app/src:/app/src/generated


EXPOSE 5014

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5014"]
