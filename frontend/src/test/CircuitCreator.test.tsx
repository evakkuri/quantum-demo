import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CircuitCreator from "../components/CircuitCreator";

const VALID_QASM = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
h q[0];
cx q[0], q[1];`;

vi.useFakeTimers();

describe("CircuitCreator", () => {
  const onCircuitCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    onCircuitCreated.mockReset();
  });

  function mockValidation(
    valid: boolean,
    errors: Array<{ line: number; message: string }> = [],
  ) {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ valid, errors }),
    } as Response);
  }

  function fillForm(name: string, qasm: string) {
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: name },
    });
    fireEvent.change(screen.getByLabelText(/openqasm/i), {
      target: { value: qasm },
    });
  }

  async function waitForValidation() {
    await act(async () => {
      vi.advanceTimersByTimeAsync(600);
    });
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  }

  it("renders form with name, QASM textarea, and submit button", () => {
    render(<CircuitCreator onCircuitCreated={onCircuitCreated} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/openqasm/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create circuit/i }),
    ).toBeInTheDocument();
  });

  it("submit button is disabled when form is empty", () => {
    render(<CircuitCreator onCircuitCreated={onCircuitCreated} />);

    expect(
      screen.getByRole("button", { name: /create circuit/i }),
    ).toBeDisabled();
  });

  it("shows validation error returned from backend", async () => {
    mockValidation(false, [{ line: 1, message: "Invalid QASM" }]);

    render(<CircuitCreator onCircuitCreated={onCircuitCreated} />);
    fillForm("Test", "bad qasm");

    await waitForValidation();

    expect(screen.queryByText(/✓ valid openqasm/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create circuit/i }),
    ).toBeDisabled();
  });

  it("shows success message when backend returns valid", async () => {
    mockValidation(true);

    render(<CircuitCreator onCircuitCreated={onCircuitCreated} />);
    fillForm("Bell State", VALID_QASM);

    await waitForValidation();

    expect(screen.getByText(/✓ valid openqasm/i)).toBeInTheDocument();
  });

  it("enables submit button when name and valid QASM are provided", async () => {
    mockValidation(true);

    render(<CircuitCreator onCircuitCreated={onCircuitCreated} />);
    fillForm("Bell State", VALID_QASM);

    await waitForValidation();

    expect(
      screen.getByRole("button", { name: /create circuit/i }),
    ).toBeEnabled();
  });

  it("submits to backend and calls onCircuitCreated on success", async () => {
    mockValidation(true);

    render(<CircuitCreator onCircuitCreated={onCircuitCreated} />);
    fillForm("Bell State", VALID_QASM);

    await waitForValidation();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 42,
        name: "Bell State",
        openqasm_code: VALID_QASM,
      }),
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: /create circuit/i }));

    await vi.waitFor(() => {
      expect(onCircuitCreated).toHaveBeenCalledWith(42);
    });
  });

  it("no validation message shown when QASM field is empty", () => {
    render(<CircuitCreator onCircuitCreated={onCircuitCreated} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test" },
    });

    expect(screen.queryByText(/✓ valid openqasm/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/validation-error/i)).not.toBeInTheDocument();
  });
});
