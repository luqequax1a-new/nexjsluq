import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900">Sayfa bulunamadı</h1>
        <p className="mt-2 text-gray-600">Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p>
        <div className="mt-6">
          <Link href="/" className="text-primary hover:underline">
            Anasayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}

