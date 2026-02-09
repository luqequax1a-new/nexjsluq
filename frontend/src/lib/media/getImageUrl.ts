const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Next.js image optimizer fetches from server-side where "localhost" may resolve
// to IPv6 (::1) causing ECONNREFUSED. Force IPv4 for image URLs.
const API_URL = RAW_API_URL.replace("//localhost:", "//127.0.0.1:");

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-cat.jpg";

  const trimmed = String(path).trim();
  if (!trimmed) return "/placeholder-cat.jpg";

  // Guard: sometimes non-media identifiers (slug/uids) are mistakenly passed as image paths.
  // If it doesn't look like a path/URL/filename, fall back to placeholder.
  const looksLikeMediaRef =
    trimmed.startsWith("http") ||
    trimmed.startsWith("/") ||
    trimmed.includes("/") ||
    trimmed.includes(".") ||
    trimmed.startsWith("media/") ||
    trimmed.startsWith("/media/") ||
    trimmed.startsWith("storage/") ||
    trimmed.startsWith("/storage/");

  if (!looksLikeMediaRef) return "/placeholder-cat.jpg";

  // If we reach here, it's a real path.
  if (trimmed === "/placeholder-cat.jpg") return trimmed;

  const normalizeMediaPath = (p: string) => {
    if (p.startsWith("/media/")) return `/storage${p}`;
    if (p.startsWith("media/")) return `storage/${p}`;
    return p;
  };

  if (trimmed.startsWith("http")) {
    const fixedHost = trimmed.replace("//localhost:", "//127.0.0.1:");

    try {
      const u = new URL(fixedHost);
      // Only rewrite /media/* to /storage/media/*.
      // Do NOT double-prefix when URL already contains /storage/media/*.
      if (u.pathname.startsWith("/media/")) {
        u.pathname = `/storage${u.pathname}`;
      }
      return u.toString();
    } catch {
      // Fallback to previous behavior for unexpected URL formats.
      if (fixedHost.includes("/storage/media/")) return fixedHost;
      return fixedHost.replace("/media/", "/storage/media/");
    }
  }

  const p = normalizeMediaPath(trimmed);
  if (p.startsWith("/")) {
    // If it's a local static asset (like /placeholder-cat.jpg), don't prefix with API_URL
    if (p.startsWith("/placeholder") || p.startsWith("/assets/")) {
      return p;
    }
    return `${API_URL}${p}`;
  }
  return `${API_URL}/${p}`;
}
