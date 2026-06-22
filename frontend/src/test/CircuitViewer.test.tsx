import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CircuitViewer from "../components/CircuitViewer";

const mockCircuitData = {
  circuit: {
    id: 1,
    name: "Bell State (EPR Pair)",
    openqasm_code:
      'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\ncx q[0], q[1];',
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  diagram_base64:
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  error: null,
};

describe("CircuitViewer", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows loading state initially", () => {
    // fetch returns a never-resolving promise so component stays in loading state
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));

    render(<CircuitViewer circuitId={1} />);
    expect(screen.getByText("Loading circuit...")).toBeInTheDocument();
  });

  it("displays circuit name and metadata when loaded", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCircuitData,
    } as Response);

    render(<CircuitViewer circuitId={1} />);

    await waitFor(() => {
      expect(screen.getByText("Bell State (EPR Pair)")).toBeInTheDocument();
    });

    expect(screen.getByText(/Circuit #1/)).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  it("displays circuit diagram when base64 is provided", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCircuitData,
    } as Response);

    render(<CircuitViewer circuitId={1} />);

    await waitFor(() => {
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute(
        "src",
        expect.stringContaining("data:image/png;base64,"),
      );
    });
  });

  it("displays OpenQASM source code", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCircuitData,
    } as Response);

    render(<CircuitViewer circuitId={1} />);

    await waitFor(() => {
      expect(screen.getByText("OpenQASM Source")).toBeInTheDocument();
    });

    const codeBlock = screen.getByText(/OPENQASM 2\.0/);
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock.tagName).toBe("PRE");
  });

  it("shows error when diagram generation fails", async () => {
    const errorData = {
      ...mockCircuitData,
      diagram_base64: null,
      error: "Failed to generate diagram: Invalid QASM",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => errorData,
    } as Response);

    render(<CircuitViewer circuitId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to generate diagram: Invalid QASM"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<CircuitViewer circuitId={1} />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("fetches correct circuit when circuitId changes", async () => {
    const circuit1 = {
      ...mockCircuitData,
      circuit: { ...mockCircuitData.circuit, name: "Circuit 1" },
    };
    const circuit2 = {
      ...mockCircuitData,
      circuit: { ...mockCircuitData.circuit, name: "Circuit 2" },
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => circuit1,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => circuit2,
      } as Response);

    const { rerender } = render(<CircuitViewer circuitId={1} />);

    await waitFor(() => {
      expect(screen.getByText("Circuit 1")).toBeInTheDocument();
    });

    rerender(<CircuitViewer circuitId={2} />);

    await waitFor(() => {
      expect(screen.getByText("Circuit 2")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/circuits/1/diagram", undefined);
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/circuits/2/diagram", undefined);
  });
});
