export interface Circuit {
  id: number;
  name: string;
  openqasm_code: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationError {
  line: number;
  message: string;
}
