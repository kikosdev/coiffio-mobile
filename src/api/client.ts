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
  /**
   * The full parsed error body, when the backend sent one beyond `{ message }` — e.g. leave-
   * request approval's 409 `{ message, conflicts }`. `unknown` because its shape is endpoint-
   * specific; callers that need a field off it should narrow with a type guard.
   */
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
// Guards concurrent 401s (e.g. three in-flight requests all rejected together) down to a
// single purge/redirect. Reset whenever a real token is set — i.e. a new session starts, so a
// later 401 in *that* session can trigger the callback again.
let unauthorizedHandled = false;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) unauthorizedHandled = false;
}

/**
 * Registered by stores/auth.ts at module load (never imported the other way — client.ts must
 * stay decoupled from auth.ts to avoid a circular import). Fires on a 401 received mid-session;
 * a 401 during authStore.hydrate()'s own startup token check is intentionally left to
 * hydrate()'s existing catch block — the registered callback self-guards against that case by
 * checking session state before acting, not this module.
 */
export function setUnauthorizedCallback(fn: () => void): void {
  onUnauthorized = fn;
}

function handleUnauthorized(): void {
  if (unauthorizedHandled) return;
  unauthorizedHandled = true;
  onUnauthorized?.();
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function fetchWithTimeout(method: HttpMethod, url: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  if (__DEV__) console.log(`[api] → ${method} ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
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
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetchWithTimeout(method, url, body);

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (__DEV__) console.log(`[api] ← ${res.status} ${method} ${url}`, json);

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    const message = json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json);
  }

  // Backend envelope: { data, message }
  return (json?.data ?? null) as T;
}

/**
 * For endpoints that respond with a raw body instead of the `{ data, message }` envelope
 * (e.g. `GET /reports/export.csv`, `Content-Type: text/csv`) — `request()` always runs the
 * body through `JSON.parse`, which throws on non-JSON payloads.
 */
async function requestText(method: HttpMethod, path: string, body?: unknown): Promise<string> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetchWithTimeout(method, url, body);
  const text = await res.text();

  if (__DEV__) console.log(`[api] ← ${res.status} ${method} ${url} (text, ${text.length}b)`);

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    let message = `Request failed (${res.status})`;
    try {
      const json = JSON.parse(text);
      message = json?.message ?? message;
    } catch {
      // body wasn't JSON either — keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  return text;
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
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string, params?: Record<string, QueryValue>) =>
    request<T>('DELETE', withQuery(path, params)),
  /** Same auth/timeout handling as `get`, but returns the raw response body — for non-JSON responses. */
  getText: (path: string, params?: Record<string, QueryValue>) =>
    requestText('GET', withQuery(path, params)),
};
