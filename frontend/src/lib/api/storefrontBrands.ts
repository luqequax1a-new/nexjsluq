import { apiFetch } from "@/lib/api";

type Brand = { id: number; name: string; slug?: string; image?: string | null };

export async function getStorefrontBrands(): Promise<Brand[]> {
  const data: any = await apiFetch<any>(`/api/brands?paginate=false`, { cache: "no-store" });

  const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  return (list as any[])
    .map((b) => ({
      id: Number(b?.id),
      name: String(b?.name ?? ""),
      slug: b?.slug,
      image: b?.image ?? null,
    }))
    .filter((b) => Number.isFinite(b.id) && b.id > 0 && b.name.trim());
}
