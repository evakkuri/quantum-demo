/*
Helper section on what QASM properties are supported by the app's parser
*/
export default function QasmReference() {
  return (
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
              <code>s</code>, <code>sdg</code>, <code>t</code>, <code>tdg</code>{" "}
              — phase
            </li>
            <li>
              <code>rx(θ)</code>, <code>ry(θ)</code>, <code>rz(θ)</code> —
              rotations
            </li>
            <li>
              <code>u1(λ)</code>, <code>u2(φ,λ)</code>, <code>u3(θ,φ,λ)</code> —
              generic
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
              <code>cy</code>, <code>cz</code>, <code>ch</code> — controlled
              Pauli/H
            </li>
            <li>
              <code>swap</code> — swap
            </li>
            <li>
              <code>crz(θ)</code>, <code>cu1(λ)</code> — controlled rotations
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
  );
}
