/*
Component for creating new circuit diagrams.

Validates QASM code against backend when writing.
*/

import { useState, useEffect } from "react";
import QasmReference from "./QasmReference";
import type { ValidationError } from "../types";

interface Props {
  name: string;
  onNameChange: (name: string) => void;
  openqasm: string;
  onOpenqasmChange: (qasm: string) => void;
  onCircuitCreated: (newId: number) => void;
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

          <QasmReference />

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
