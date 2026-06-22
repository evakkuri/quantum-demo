from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal, init_db
from app.models import Circuit
from app.routes import router

# When deployed, frontend is served from static files via FastAPI
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

# Sample QASM from assignment, automatically added to SQLite
SAMPLE_QASM = """OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
h q[0];
cx q[0], q[1];
"""


# Seed DB on startup with the sample QASM
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed sample circuit if DB is empty
    db = SessionLocal()
    try:
        if db.query(Circuit).count() == 0:
            sample = Circuit(
                name="Bell State (EPR Pair)",
                openqasm_code=SAMPLE_QASM.strip(),
            )
            db.add(sample)
            db.commit()
    finally:
        db.close()
    yield


app = FastAPI(
    title="Quantum Circuit Viewer",
    description="API for storing and visualizing OpenQASM quantum circuits",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the Vite dev server to call the backend during local development.
# In production the frontend is served by FastAPI itself (same origin), so
# CORS is not needed there.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# Serve the built frontend in production (after `npm run build`).
# check_dir=False so startup doesn't fail when dist doesn't exist yet in dev.
app.frontend("/", directory=FRONTEND_DIST, check_dir=False)
