from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, SessionLocal
from app.models import Circuit
from app.routes import router


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
