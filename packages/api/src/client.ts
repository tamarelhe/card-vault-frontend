export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

type TokenProvider = () => string | null;
type OnUnauthorized = () => void;

interface ApiClientConfig {
  baseUrl: string;
  getToken: TokenProvider;
  onUnauthorized?: OnUnauthorized;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const err = json as { code?: string; message?: string } | null;
    const code = err?.code ?? 'UNKNOWN';
    const message = err?.message ?? res.statusText;

    if (res.status === 401) throw new UnauthorizedError(message);
    if (res.status === 404) throw new NotFoundError(message);
    throw new ApiError(res.status, code, message);
  }

  return json as T;
}

export function createApiClient(config: ApiClientConfig) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = config.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    try {
      return await parseResponse<T>(res);
    } catch (err) {
      if (err instanceof UnauthorizedError) config.onUnauthorized?.();
      throw err;
    }
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
