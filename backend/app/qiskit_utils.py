import base64
import io
import re

import matplotlib
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit

matplotlib.use("Agg")


def generate_circuit_diagram(openqasm_code: str) -> str:
    """Generate a circuit diagram from OpenQASM code and return as base64 PNG."""
    qc = QuantumCircuit.from_qasm_str(openqasm_code)

    fig = qc.draw("mpl")
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=150)
    buf.seek(0)
    img_bytes = buf.read()
    buf.close()
    plt.close(fig)

    return base64.b64encode(img_bytes).decode("utf-8")


def validate_openqasm(openqasm_code: str) -> tuple[bool, list[dict]]:
    """Validate OpenQASM code. Returns (valid, errors)."""
    errors = []

    if not openqasm_code.strip():
        return False, []

    try:
        qc = QuantumCircuit.from_qasm_str(openqasm_code)
        if qc.num_qubits == 0:
            errors.append({"line": 0, "message": "No quantum registers defined"})
    except Exception as e:
        error_msg = str(e).strip('"')
        line_match = re.search(r"line (\d+)", error_msg, re.IGNORECASE)
        line = int(line_match.group(1)) if line_match else 0
        errors.append({"line": line, "message": error_msg})

    return len(errors) == 0, errors
