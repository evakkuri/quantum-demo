import base64
import io

import matplotlib

matplotlib.use("Agg")

from qiskit import QuantumCircuit


def generate_circuit_diagram(openqasm_code: str) -> str:
    """Generate a circuit diagram from OpenQASM code and return as base64 PNG."""
    qc = QuantumCircuit.from_qasm_str(openqasm_code)

    fig = qc.draw("mpl")
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=150)
    buf.seek(0)
    img_bytes = buf.read()
    buf.close()

    import matplotlib.pyplot as plt

    plt.close(fig)

    return base64.b64encode(img_bytes).decode("utf-8")
