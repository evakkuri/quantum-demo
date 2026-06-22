# Multi-stage build: compile the SPA, then serve it + the API from one FastAPI process.

# 1. Build the frontend into static assets.
FROM node:24-slim AS frontend-build
WORKDIR /frontend
# Copy manifests first so `npm ci` is cached until dependencies change.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Backend runtime. uv installs the locked dependencies; FastAPI serves the
#    API and the built SPA (main.py resolves <repo>/frontend/dist relative to
#    backend/app, so the layout under /app must mirror the repo).
FROM python:3.12-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:0.11.23@sha256:d0a0a753ab981624b49c97abc98821c1c09f4ca69d1ef5cee69c501be3d88479 /uv /uvx /bin/

# Run as an unprivileged user. Created before the dependency install so the venv
# and copied files are owned by it, avoiding a costly recursive chown of the
# dependency layer. The app writes its SQLite file into the workdir at runtime,
# so /app must be owned by this user.
RUN useradd --create-home --uid 1000 app \
    && mkdir -p /app/backend /app/frontend \
    && chown -R app:app /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    MPLCONFIGDIR=/tmp/matplotlib
WORKDIR /app/backend
USER app

# Dependency layer: copy only the lock + manifest so this layer is cached
# until dependencies change (see FastAPI's docker-cache guidance).
COPY --chown=app:app backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Application code and the built frontend.
COPY --chown=app:app backend/app ./app
COPY --from=frontend-build --chown=app:app /frontend/dist /app/frontend/dist

ENV PATH="/app/backend/.venv/bin:$PATH"

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/api/health').status==200 else 1)"

CMD ["fastapi", "run", "app/main.py", "--port", "8080"]
