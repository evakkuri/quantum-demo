import base64
import io
import re

from qiskit import QuantumCircuit


def generate_circuit_diagram(openqasm_code: str) -> str:
    """Generate a circuit diagram from OpenQASM code and return as base64 PNG."""
    # matplotlib is imported lazily so validation-only requests and startup
    # don't pay its (heavy) import cost. use("Agg") must run before pyplot.
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    qc = QuantumCircuit.from_qasm_str(openqasm_code)

    fig = qc.draw("mpl")
    try:
        with io.BytesIO() as buf:
            fig.savefig(buf, format="png", bbox_inches="tight", dpi=150)
            img_bytes = buf.getvalue()
    finally:
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
