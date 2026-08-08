FROM python:3.11-slim

WORKDIR /app

# Copy install config and source
COPY engine/pyproject.toml .
COPY engine/src/ src/

# Install the package
RUN pip install --no-cache-dir -e ".[dev]"

# Copy stream configs
COPY streams/ streams/

# Copy tests
COPY engine/tests/ tests/

CMD ["python", "-m", "engine.pipeline"]
