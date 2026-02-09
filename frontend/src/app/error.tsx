"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900">Bir hata oluştu</h1>
        <p className="mt-2 text-gray-600">
          Sayfa yüklenirken beklenmeyen bir sorun oluştu. Tekrar deneyebilirsiniz.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="h-10 px-4 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black transition-colors"
          >
            Tekrar dene
          </button>
        </div>
      </div>
    </div>
  );
}

