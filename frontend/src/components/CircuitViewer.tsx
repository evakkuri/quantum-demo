/*
View stored circuit diagrams rendered from code.
*/

import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import type { Circuit } from "../types";

interface CircuitData {
  circuit: Circuit;
  diagram_base64: string | null;
  circuit_info: Record<string, unknown> | null;
  error: string | null;
}

interface Props {
  circuitId: number;
}

export default function CircuitViewer({ circuitId }: Props) {
  const [data, setData] = useState<CircuitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiFetch<CircuitData>(`/api/circuits/${circuitId}/diagram`)
      .then(setData)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load circuit");
      })
      .finally(() => setLoading(false));
  }, [circuitId]);

  if (loading) return <p className="loading">Loading circuit...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  return (
    <div className="circuit-viewer">
      <h2>{data.circuit.name}</h2>
      <p className="circuit-meta">
        Circuit #{data.circuit.id} &middot; Created{" "}
        {new Date(data.circuit.created_at).toLocaleDateString()}
      </p>

      {data.diagram_base64 ? (
        <div className="diagram-container">
          <img
            src={`data:image/png;base64,${data.diagram_base64}`}
            alt={`Circuit diagram for ${data.circuit.name}`}
          />
        </div>
      ) : (
        <p className="diagram-error">{data.error ?? "No diagram available"}</p>
      )}

      {data.circuit_info && (
        <div className="qasm-section">
          <details>
            <summary>Parsed circuit</summary>
            <pre className="qasm-code">
              {JSON.stringify(data.circuit_info, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="qasm-section">
        <h3>OpenQASM Source</h3>
        <pre className="qasm-code">{data.circuit.openqasm_code}</pre>
      </div>
    </div>
  );
}
