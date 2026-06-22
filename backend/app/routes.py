from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Circuit
from app.qiskit_utils import generate_circuit_diagram, validate_openqasm
from app.schemas import (
    CircuitCreate,
    CircuitDiagramResponse,
    CircuitResponse,
    ValidateRequest,
    ValidateResponse,
)

router = APIRouter(prefix="/api/circuits", tags=["circuits"])


def get_circuit_or_404(circuit_id: int, db: Session) -> Circuit:
    circuit = db.query(Circuit).filter(Circuit.id == circuit_id).first()
    if not circuit:
        raise HTTPException(status_code=404, detail="Circuit not found")
    return circuit


@router.get("/", response_model=List[CircuitResponse])
def list_circuits(db: Session = Depends(get_db)):
    return db.query(Circuit).order_by(Circuit.created_at.desc()).all()


@router.get("/{circuit_id}", response_model=CircuitResponse)
def get_circuit(circuit_id: int, db: Session = Depends(get_db)):
    return get_circuit_or_404(circuit_id, db)


@router.get("/{circuit_id}/diagram", response_model=CircuitDiagramResponse)
def get_circuit_diagram(circuit_id: int, db: Session = Depends(get_db)):
    circuit = get_circuit_or_404(circuit_id, db)

    diagram_base64 = None
    error = None
    try:
        diagram_base64 = generate_circuit_diagram(circuit.openqasm_code)
    except Exception as e:
        error = f"Failed to generate diagram: {str(e)}"

    return CircuitDiagramResponse(
        circuit=CircuitResponse.model_validate(circuit),
        diagram_base64=diagram_base64,
        error=error,
    )


@router.post("/", response_model=CircuitResponse, status_code=201)
def create_circuit(circuit_data: CircuitCreate, db: Session = Depends(get_db)):
    circuit = Circuit(**circuit_data.model_dump())
    db.add(circuit)
    db.commit()
    db.refresh(circuit)
    return circuit


@router.post("/validate", response_model=ValidateResponse)
def validate_circuit(request: ValidateRequest):
    valid, errors = validate_openqasm(request.openqasm_code)
    return ValidateResponse(valid=valid, errors=errors)
