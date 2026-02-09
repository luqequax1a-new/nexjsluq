const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/robots.txt`, {
      next: { revalidate: 86400 },
    });
    const text = await res.text();
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return new Response(
      `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      { headers: { "Content-Type": "text/plain" } }
    );
  }
}
