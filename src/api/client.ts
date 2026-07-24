// Minimal fetch-based API client — no axios dependency.
// Base URL from EXPO_PUBLIC_API_URL, falls back to the deployed backend.

const FALLBACK_API_URL = 'https://coif-backend.onrender.com/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_API_URL;
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

if (!process.env.EXPO_PUBLIC_API_URL) {
  // Visible in dev and in `adb logcat` — flags a build where EXPO_PUBLIC_API_URL
  // wasn't inlined at bundle time (missing/wrong .env at `expo export:embed` time).
  console.warn('[api] EXPO_PUBLIC_API_URL missing at bundle time — using fallback:', FALLBACK_API_URL);
}

// Render free tier cold-starts in up to ~50s — without a generous timeout the first
// request after the backend sleeps reads as a plain network error.
const REQUEST_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const url = `${API_BASE_URL}${path}`;
  if (__DEV__) console.log(`[api] → ${method} ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (__DEV__) {
      console.log(`[api] ✗ ${method} ${url} — ${isTimeout ? `timed out after ${REQUEST_TIMEOUT_MS}ms (Render cold start?)` : 'network error'}:`, err);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (__DEV__) console.log(`[api] ← ${res.status} ${method} ${url}`, json);

  if (!res.ok) {
    const message = json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  // Backend envelope: { data, message }
  return (json?.data ?? null) as T;
}

type QueryValue = string | number | string[] | undefined;

function withQuery(path: string, params?: Record<string, QueryValue>): string {
  if (!params) return path;
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number | string[]][];
  if (entries.length === 0) return path;
  // Array values use `key[]=` (e.g. serviceIds[]=a&serviceIds[]=b) — Nest's default `qs` query
  // parser only produces an array from a bare repeated key (serviceIds=a&serviceIds=b) when
  // there are 2+ occurrences; a single service (the common case) would collapse to a plain
  // string and fail the DTO's @IsArray() check. The `[]` suffix makes `qs` emit an array
  // unconditionally, even for one item.
  const qs = entries
    .flatMap(([k, v]) => (Array.isArray(v) ? v.map((item) => [`${k}[]`, item] as const) : [[k, v] as const]))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${path}?${qs}`;
}

export const api = {
  get: <T>(path: string, params?: Record<string, QueryValue>) =>
    request<T>('GET', withQuery(path, params)),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
