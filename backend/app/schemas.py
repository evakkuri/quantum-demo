from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


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


class ValidateRequest(BaseModel):
    openqasm_code: str


class ValidationError(BaseModel):
    line: int = 0
    message: str


class ValidateResponse(BaseModel):
    valid: bool
    errors: List[ValidationError] = []
