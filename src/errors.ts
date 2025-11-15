export class APIError<T = unknown> extends Error {
  public readonly status?: number;
  public readonly data?: T;
  public readonly headers?: Record<string, string | string[]>;

  constructor(message: string, opts: { status?: number; data?: T; headers?: Record<string, string | string[]> } = {}) {
    super(message);
    this.name = 'APIError';
    this.status = opts.status;
    this.data = opts.data;
    this.headers = opts.headers;
  }
}
