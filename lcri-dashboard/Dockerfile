# ---------- Frontend Build Stage ----------
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- Python Build Stage ----------
FROM python:3.11-slim AS python-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libgdal-dev gdal-bin proj-data proj-bin python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt
RUN pip install gunicorn

# ---------- Final Production Image ----------
FROM python:3.11-slim

# Install runtime dependencies for GDAL/Geopandas
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal31 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python packages
COPY --from=python-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-builder /usr/local/bin /usr/local/bin

# Copy backend python code
COPY . .

# Copy built React frontend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Render will provide the PORT environment variable
ENV PORT=10000
EXPOSE $PORT

# Start the server using gunicorn for production
CMD gunicorn --bind 0.0.0.0:$PORT server:app --timeout 120
