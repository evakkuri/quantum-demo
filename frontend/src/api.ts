export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

// Prefer the API's `detail` message (FastAPI's error shape); fall back to the status.
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.detail === "string") return body.detail;
  } catch {
    // non-JSON error body — fall through to the status line
  }
  return `HTTP ${res.status}`;
}
