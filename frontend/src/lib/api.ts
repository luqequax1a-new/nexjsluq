export type ApiError = {
  message: string;
  status: number;
  details?: unknown;
};

export type AuthMode = "auto" | "admin" | "customer" | "none";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function normalizeBaseUrl(input: string): string {
  let s = String(input || "").trim();
  if (!s) return "http://localhost:8000";
  s = s.replace(/\/+$/, "");
  // Some env setups mistakenly set base as .../api
  s = s.replace(/\/api$/i, "");
  return s;
}

const API_URL = normalizeBaseUrl(RAW_API_URL);

// IMPORTANT:
// Cookies are host-bound, so mixing `localhost` and `127.0.0.1` will create
// separate sessions (cart appears empty after add-to-cart).
// We remember the last successful base and keep using it for consistency.
let ACTIVE_BASE_URL = API_URL;

const ADMIN_TOKEN_KEY = "admin_token";
const CUSTOMER_TOKEN_KEY = "customer_token";

function preferSameHostInDev(base: string): string {
  if (typeof window === "undefined") return base;
  try {
    const url = new URL(base);
    const pageHost = window.location.hostname;
    const devHosts = new Set(["localhost", "127.0.0.1"]);

    // Only rewrite in local dev when both are localhost-ish, to avoid breaking real deployments.
    if (devHosts.has(url.hostname) && devHosts.has(pageHost) && url.hostname !== pageHost) {
      url.hostname = pageHost;
      return url.toString().replace(/\/$/, "");
    }

    return base;
  } catch {
    return base;
  }
}

ACTIVE_BASE_URL = preferSameHostInDev(ACTIVE_BASE_URL);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown; auth?: AuthMode } = {}
): Promise<T> {
  const { auth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const inferAuthMode = (): AuthMode => {
    if (typeof window === "undefined") return "none";
    const pathname = window.location?.pathname ?? "";
    if (pathname.startsWith("/admin")) return "admin";
    if (
      pathname.startsWith("/hesap") ||
      pathname.startsWith("/giris") ||
      pathname.startsWith("/kayit") ||
      pathname.startsWith("/sifremi-unuttum") ||
      pathname.startsWith("/sifre-sifirla")
    ) {
      return "customer";
    }
    return "none";
  };

  const resolveToken = (mode: AuthMode): string | null => {
    if (typeof window === "undefined") return null;
    if (mode === "admin") return localStorage.getItem(ADMIN_TOKEN_KEY);
    if (mode === "customer") return localStorage.getItem(CUSTOMER_TOKEN_KEY);
    return null;
  };

  const authMode: AuthMode = auth ?? "auto";
  const effectiveMode: AuthMode = authMode === "auto" ? inferAuthMode() : authMode;

  // Auth Token handling
  if (!headers.has("Authorization")) {
    const token = resolveToken(effectiveMode);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (fetchOptions.method ?? "GET").toUpperCase();

  let body = fetchOptions.body;
  if (fetchOptions.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(fetchOptions.json);
  }

  if (method !== "GET" && method !== "HEAD" && !headers.has("X-XSRF-TOKEN")) {
    const raw = getCookie("XSRF-TOKEN");
    if (raw) headers.set("X-XSRF-TOKEN", decodeURIComponent(raw));
  }

  const buildUrl = (base: string) => {
    // path can be absolute (rare) or relative (/api/..)
    if (/^https?:\/\//i.test(path)) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  };

  const tryFetch = async (base: string) => {
    return fetch(buildUrl(base), {
      ...fetchOptions,
      headers,
      credentials: "include",
      body,
    });
  };

  let res: Response;
  try {
    res = await tryFetch(ACTIVE_BASE_URL);
  } catch (e) {
    // Disable fallback to prevent session ID changes
    // localhost vs 127.0.0.1 creates separate sessions
    throw {
      message: `Network error while calling API (${buildUrl(ACTIVE_BASE_URL)}). Check NEXT_PUBLIC_API_URL and backend status.`,
      status: 0,
      details: { error: String(e) },
    } as ApiError;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const extractMessage = (payload: unknown) => {
      if (!payload) return null;
      if (typeof payload === "string") return payload;
      if (typeof payload === "object") {
        const p = payload as { message?: unknown; error?: unknown };
        if (typeof p.message === "string" && p.message.trim()) return p.message;
        if (typeof p.error === "string" && p.error.trim()) return p.error;
      }
      return null;
    };

    const err: ApiError = {
      message:
        extractMessage(data) ||
        `Request failed (${res.status})`,
      status: res.status,
      details: data,
    };
    throw err;
  }

  return data as T;
}

export async function csrfCookie(): Promise<void> {
  await apiFetch("/sanctum/csrf-cookie", { method: "GET", auth: "none" });
}

export async function adminApiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  return apiFetch<T>(path, { ...options, auth: "admin" });
}

export async function customerApiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  return apiFetch<T>(path, { ...options, auth: "customer" });
}
