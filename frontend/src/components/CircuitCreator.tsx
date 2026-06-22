import { useState, useEffect } from "react";

interface Props {
  name: string;
  onNameChange: (name: string) => void;
  openqasm: string;
  onOpenqasmChange: (qasm: string) => void;
  onCircuitCreated: (newId: number) => void;
}

interface ValidationError {
  line: number;
  message: string;
}

export default function CircuitCreator({
  name,
  onNameChange,
  openqasm,
  onOpenqasmChange,
  onCircuitCreated,
}: Props) {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [isValid, setIsValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced validation call to backend — no extra frontend checks
  useEffect(() => {
    if (!openqasm.trim()) {
      setIsValid(false);
      setValidationErrors([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await fetch("/api/circuits/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openqasm_code: openqasm }),
        });
        const data = await res.json();
        setIsValid(data.valid);
        setValidationErrors(data.errors || []);
      } catch {
        setIsValid(false);
        setValidationErrors([
          { line: 0, message: "Validation service unavailable" },
        ]);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [openqasm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/circuits/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), openqasm_code: openqasm }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || `HTTP ${res.status}`);
      }

      const created = await res.json();
      onCircuitCreated(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create circuit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="circuit-creator">
      <h2>Create New Circuit</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="circuit-name">Name</label>
          <input
            id="circuit-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Bell State"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="openqasm-code">OpenQASM Code</label>

          <details className="qasm-reference">
            <summary>Supported features</summary>
            <div className="qasm-reference-content">
              <div className="qasm-reference-group">
                <h4>Structure</h4>
                <ul>
                  <li>
                    <code>OPENQASM 2.0;</code> — required header
                  </li>
                  <li>
                    <code>include &quot;qelib1.inc&quot;;</code> — standard gate
                    library
                  </li>
                </ul>
              </div>
              <div className="qasm-reference-group">
                <h4>Registers</h4>
                <ul>
                  <li>
                    <code>qreg name[n];</code> — quantum register of n qubits
                  </li>
                  <li>
                    <code>creg name[n];</code> — classical register of n bits
                  </li>
                </ul>
              </div>
              <div className="qasm-reference-group">
                <h4>Single-qubit gates</h4>
                <ul>
                  <li>
                    <code>h</code> — Hadamard
                  </li>
                  <li>
                    <code>x</code>, <code>y</code>, <code>z</code> — Pauli
                  </li>
                  <li>
                    <code>s</code>, <code>sdg</code>, <code>t</code>,{" "}
                    <code>tdg</code> — phase
                  </li>
                  <li>
                    <code>rx(θ)</code>, <code>ry(θ)</code>, <code>rz(θ)</code> —
                    rotations
                  </li>
                  <li>
                    <code>u1(λ)</code>, <code>u2(φ,λ)</code>,{" "}
                    <code>u3(θ,φ,λ)</code> — generic
                  </li>
                </ul>
              </div>
              <div className="qasm-reference-group">
                <h4>Two-qubit gates</h4>
                <ul>
                  <li>
                    <code>cx</code> — CNOT
                  </li>
                  <li>
                    <code>cy</code>, <code>cz</code>, <code>ch</code> —
                    controlled Pauli/H
                  </li>
                  <li>
                    <code>swap</code> — swap
                  </li>
                  <li>
                    <code>crz(θ)</code>, <code>cu1(λ)</code> — controlled
                    rotations
                  </li>
                </ul>
              </div>
              <div className="qasm-reference-group">
                <h4>Three-qubit gates</h4>
                <ul>
                  <li>
                    <code>ccx</code> — Toffoli
                  </li>
                  <li>
                    <code>cswap</code> — Fredkin
                  </li>
                </ul>
              </div>
              <div className="qasm-reference-group">
                <h4>Operations</h4>
                <ul>
                  <li>
                    <code>measure q[i] -&gt; c[j];</code>
                  </li>
                  <li>
                    <code>reset q[i];</code>
                  </li>
                  <li>
                    <code>barrier q;</code>
                  </li>
                </ul>
              </div>
            </div>
          </details>

          <textarea
            id="openqasm-code"
            value={openqasm}
            onChange={(e) => onOpenqasmChange(e.target.value)}
            placeholder={`OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\ncx q[0], q[1];`}
            rows={10}
            required
          />
          <div className="validation-status">
            {isValidating && (
              <p className="validation-pending">Validating...</p>
            )}
            {!isValidating && openqasm && !isValid && (
              <p className="validation-error">
                {validationErrors.map((err, i) => (
                  <span key={i}>
                    {err.line > 0 && `Line ${err.line}: `}
                    {err.message}
                  </span>
                ))}
              </p>
            )}
            {!isValidating && isValid && (
              <p className="validation-success">✓ Valid OpenQASM</p>
            )}
          </div>
        </div>

        {error && <p className="submit-error">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || !name.trim() || submitting || isValidating}
          className="submit-button"
        >
          {submitting ? "Creating..." : "Create Circuit"}
        </button>
      </form>
    </div>
  );
}
