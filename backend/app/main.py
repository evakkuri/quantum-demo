from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import SessionLocal, init_db
from app.models import Circuit
from app.routes import router

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


SAMPLE_QASM = """OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
h q[0];
cx q[0], q[1];
"""


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# Serve the built frontend in production.
# Only activates when frontend/dist exists (i.e. after `npm run build`).
if FRONTEND_DIST.is_dir():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(FRONTEND_DIST / "index.html")
