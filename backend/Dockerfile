# Dockerfile for FastAPI backend
FROM python:3.13-slim

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip && \
    pip install fastapi uvicorn sqlalchemy alembic fastapi-socketio pytest httpx psycopg2-binary

ENV PYTHONPATH=/app
    
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
