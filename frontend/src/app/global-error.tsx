"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body>
        <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Uygulama hatası</h1>
          <p style={{ color: "#4b5563", marginBottom: 16 }}>
            Beklenmeyen bir hata oluştu. Sayfayı yenileyebilir veya tekrar deneyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 10,
              background: "#111827",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
          <pre style={{ marginTop: 16, whiteSpace: "pre-wrap", color: "#6b7280", fontSize: 12 }}>
            {String(error?.message || "")}
          </pre>
        </div>
      </body>
    </html>
  );
}

