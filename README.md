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
uv run uvicorn app.main:app --reload  # Start server on :8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # Start dev server on :5173
```

Open http://localhost:5173 in your browser.

### Running Tests

```bash
cd backend
uv run pytest -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/circuits/` | List all circuits |
| GET | `/api/circuits/{id}` | Get circuit by ID |
| GET | `/api/circuits/{id}/diagram` | Get circuit with diagram (base64 PNG) |
| POST | `/api/circuits/` | Create a new circuit |

### Example: Create Circuit

```bash
curl -X POST http://localhost:8000/api/circuits/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bell State",
    "openqasm_code": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\nh q[0];\ncx q[0], q[1];"
  }'
```

## Design Choices

- **SQLite** for zero-config local deployment; easily swappable to PostgreSQL
- **Base64 PNG** diagrams returned inline to avoid static file serving complexity
- **Vite proxy** forwards `/api` requests to the backend during development
- **Qiskit matplotlib drawer** generates publication-quality circuit diagrams
- **Seeded sample circuit** (Bell State / EPR pair) on first startup

## What's Left Out (and How to Add It)

| Feature | Approach |
|---------|----------|
| CI/CD (GitHub Actions) | Add `.github/workflows/ci.yml` with pytest + vite build |
| IaC (Terraform/Pulumi) | Define ECS/Fargate or Railway/Render deploy configs |
| User auth | Add JWT or OAuth2 with FastAPI's `OAuth2PasswordBearer` |
| Circuit editing | Monaco editor component for in-browser OpenQASM editing |
| Multiple diagram styles | Support Qiskit's `text`, `latex`, and `mpl` output formats |
| Cloud DB | Swap SQLAlchemy URL to PostgreSQL connection string |
| Docker Compose | Add `docker-compose.yml` with backend + frontend services |
| Frontend tests | Add Vitest + React Testing Library |
