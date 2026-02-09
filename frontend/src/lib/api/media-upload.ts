export type UploadedMedia = {
  id: number;
  disk: string | null;
  type: "image" | "video" | "file";
  path: string;
  thumb_path: string | null;
  mime: string | null;
  size: number | null;
  original_name: string | null;
  alt: string | null;
  scope: "global" | "product" | "variant";
  created_at?: string;
};

export type UploadMediaResponse = {
  media: UploadedMedia;
  url: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export async function uploadGlobalImage(file: File, params?: { alt?: string }): Promise<UploadMediaResponse> {
  const form = new FormData();
  form.append("scope", "global");
  form.append("type", "image");
  if (params?.alt) form.append("alt", params.alt);
  form.append("file", file);

  const headers = new Headers();
  headers.set("Accept", "application/json");

  // Auth Token handling (same pattern as apiFetch)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // XSRF token
  const raw = getCookie("XSRF-TOKEN");
  if (raw) headers.set("X-XSRF-TOKEN", decodeURIComponent(raw));

  const res = await fetch(`${API_URL}/api/media/upload`, {
    method: "POST",
    headers,
    credentials: "include",
    body: form,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data && typeof (data as any).message === "string"
        ? (data as any).message
        : `Upload failed (${res.status})`;

    throw new Error(msg);
  }

  return data as UploadMediaResponse;
}
