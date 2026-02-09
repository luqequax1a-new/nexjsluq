import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPageData } from "@/lib/api/storefront";
import type { ApiError } from "@/lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data: any = await getPageData(slug);
    const page = data?.page;
    return {
      title: page?.meta_title || page?.title || "Sayfa",
      description: page?.meta_description || page?.excerpt || "",
    };
  } catch {
    return { title: "Sayfa Bulunamadı" };
  }
}

export default async function StorefrontCustomPage({ params }: Props) {
  const { slug } = await params;

  try {
    const data: any = await getPageData(slug);
    const page = data?.page;

    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-6">{page?.title}</h1>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: String(page?.content_html || "") }}
        />
      </div>
    );
  } catch (error) {
    const e = error as Partial<ApiError> | any;
    if (e && typeof e === "object" && Number(e.status) === 404) {
      return notFound();
    }

    const msg = e && typeof e === "object" && typeof e.message === "string" ? e.message : "Sayfa yüklenemedi.";

    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">{msg}</div>
      </div>
    );
  }
}
