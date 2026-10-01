# Nexus Social Publisher — Docker launcher (optional; works equally via bare systemd)
# Build: docker build -t nexus-publisher -f publisher/Dockerfile .
FROM python:3.11-slim

WORKDIR /app

# Core deps for X (xurl is a separate CLI — mount/inject ~/.xurl or install xurl).
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Publisher package
COPY publisher/ publisher/
RUN pip install --no-cache-dir psycopg2-binary

# xurl CLI (X API official). Requires user to run `xurl auth oauth2` and persist ~/.xurl.
RUN curl -fsSL https://raw.githubusercontent.com/xdevplatform/xurl/main/install.sh | bash \
    && ln -sf ~/.local/bin/xurl /usr/local/bin/xurl || true

# Optional platform libs
RUN pip install --no-cache-dir atproto pillow 2>/dev/null || true

ENV PYTHONUNBUFFERED=1
# Expect: SITE_BASE_URL, DATABASE_URL, SOCIAL_DISABLED, platform creds via env.

ENTRYPOINT ["python", "-m", "publisher.run"]
CMD ["post"]
