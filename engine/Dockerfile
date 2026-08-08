FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

COPY src/ src/
COPY streams/ /app/streams/

CMD ["python", "-m", "engine.pipeline"]
