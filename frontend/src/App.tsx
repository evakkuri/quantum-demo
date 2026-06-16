import { useState, useEffect } from "react";
import CircuitViewer from "./components/CircuitViewer";

interface Circuit {
  id: number;
  name: string;
  openqasm_code: string;
  created_at: string;
  updated_at: string;
}

function App() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCircuits() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/circuits/");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Circuit[] = await res.json();
      setCircuits(data);
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch circuits");
    } finally {
      setLoading(false);
    }
  }

  // Load circuits on mount
  useEffect(() => {
    fetchCircuits();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Quantum Circuit Viewer</h1>
        <p className="subtitle">OpenQASM circuit visualization demo</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Circuits</h2>
            <button onClick={fetchCircuits} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <ul className="circuit-list">
            {circuits.map((c) => (
              <li key={c.id}>
                <button
                  className={`circuit-item ${selectedId === c.id ? "active" : ""}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="circuit-name">{c.name}</span>
                  <span className="circuit-id">#{c.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="viewer">
          {selectedId ? (
            <CircuitViewer circuitId={selectedId} />
          ) : (
            <p className="placeholder">Select a circuit to view it</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
