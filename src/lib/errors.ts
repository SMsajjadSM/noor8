export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
export class ConfigError extends ApiError {
  constructor(message: string) {
    super(503, "CONFIG", message);
  }
}
