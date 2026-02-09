import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sadece storefront sayfalarında redirect kontrolü yap
  // Admin, API, _next, static dosyalar hariç
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `${API_URL}/api/storefront/resolve-redirect?path=${encodeURIComponent(pathname)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: 60 }, // 60 saniye cache
      }
    );

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();

      if (data?.redirect?.target_url) {
        const targetUrl = new URL(data.redirect.target_url, request.url);
        const statusCode = data.redirect.status_code === 302 ? 302 : 301;

        if (statusCode === 301) {
          return NextResponse.redirect(targetUrl, { status: 301 });
        }
        return NextResponse.redirect(targetUrl, { status: 302 });
      }
    }
  } catch {
    // API erişilemezse devam et, redirect'i engelleme
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin, API, _next, static dosyalar hariç tüm path'ler
    "/((?!admin|api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
