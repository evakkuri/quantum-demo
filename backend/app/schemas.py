from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CircuitBase(BaseModel):
    name: str
    openqasm_code: str


class CircuitCreate(CircuitBase):
    pass


class CircuitResponse(CircuitBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CircuitDiagramResponse(BaseModel):
    circuit: CircuitResponse
    diagram_base64: Optional[str] = None
    error: Optional[str] = None
