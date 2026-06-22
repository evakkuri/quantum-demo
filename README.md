# Quantum Circuit Viewer

A web application for storing and visualizing OpenQASM quantum circuits.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────┐
│   React/TS   │────▶│  FastAPI    │────▶│  SQLite  │
│   Frontend   │◀────│  Backend    │◀────│    DB    │
└─────────────┘     └──────┬──────┘     └──────────┘
                           │
                     ┌─────▼─────┐
                     │   Qiskit   │
                     │ (diagrams) │
                     └───────────┘
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite
- **Quantum:** Qiskit (circuit parsing & diagram generation)
- **Package Manager:** uv (Python), npm (Node)

## Quick Start

### Backend

```bash
cd backend
uv sync                    # Install dependencies
uv run fastapi dev                 # Start server on :8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # Start dev server on :8080, proxies /api to :8000
```

Open http://localhost:8080 in your browser.

## Deploying to Sprites

[Sprites](https://sprites.dev) are persistent microVM environments with a public URL. The app runs as a single process: FastAPI serves both the API and the built frontend on port 8080.

```bash
# 1. Install the Sprite CLI and authenticate (uses Fly.io)
curl -fsSL https://sprites.dev/install.sh | sh
sprite org auth

# 2. Create a Sprite and set it as active
sprite create qmill-demo
sprite use qmill-demo

# 3. Clone the repo into the Sprite
sprite exec -- git clone <your-repo-url> /home/sprite/qmill_demo

# 4. Install dependencies and build the frontend
sprite exec -- bash -c "cd /home/sprite/qmill_demo/frontend && npm install && npm run build"
sprite exec -- bash -c "cd /home/sprite/qmill_demo/backend && uv sync"

# 5. Register as a persistent Service (auto-restarts after hibernation)
sprite-env services create qmill \
  --cmd uv \
  --args "run uvicorn app.main:app --host 0.0.0.0 --port 8080" \
  --workdir /home/sprite/qmill_demo/backend

# 6. Make the URL publicly accessible
sprite url update --auth public
```

The Sprite URL (`https://<name>.sprites.app`) routes to port 8080. FastAPI detects the built `frontend/dist/` at startup and serves it automatically — no separate frontend process needed.

After a code change, redeploy with:

```bash
sprite exec -- bash -c "cd /home/sprite/qmill_demo && git pull"
sprite exec -- bash -c "cd /home/sprite/qmill_demo/frontend && npm run build"
sprite-env services restart qmill
```

### Running Tests

```bash
cd backend
uv run pytest -v
```
