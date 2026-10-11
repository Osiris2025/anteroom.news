FROM python:3.11-slim

WORKDIR /app

# Copy install config and source
COPY engine/pyproject.toml .
COPY engine/src/ src/

# Install the package
RUN pip install --no-cache-dir -e ".[dev]"

# Copy stream configs
COPY streams/ streams/

# Shared routing rules + subcategory labels (also bind-mounted read-only by
# docker-compose so a rules edit needs only an engine restart, not a rebuild)
COPY frontend/src/lib/routing-rules.json /app/routing-rules.json
COPY frontend/src/lib/subcategories.json /app/subcategories.json

# Copy tests
COPY engine/tests/ tests/

CMD ["python", "-m", "engine.pipeline"]
