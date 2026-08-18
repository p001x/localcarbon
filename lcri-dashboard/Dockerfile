# Use multi‑stage build to keep image small
# ---------- Build stage ----------
FROM python:3.11-slim AS builder

# Install system dependencies needed by geopandas, folium, gdal
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgdal-dev \
    gdal-bin \
    proj-data \
    proj-bin \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only requirements first for caching
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ---------- Final stage ----------
FROM python:3.11-slim

# Install runtime system deps (same as builder but without compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal31 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
WORKDIR /app
COPY . .

# Expose Streamlit default port
EXPOSE 8501

# Set Streamlit to run on 0.0.0.0
ENV STREAMLIT_SERVER_HEADLESS=true
ENV STREAMLIT_SERVER_ENABLECORS=false
ENV STREAMLIT_SERVER_PORT=8501

# Entry point
CMD ["sh", "-c", "echo 'Streamlit UI deprecated. Use Flask+React at http://localhost:5173' && sleep infinity"]
