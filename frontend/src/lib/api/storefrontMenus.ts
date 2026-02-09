const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type StorefrontMenuItem = {
  id: number;
  type: "url" | "category";
  label: string;
  label_i18n?: Record<string, string>;
  url: string | null;
  image?: string | null;
  category_id: number | null;
  target?: "_self" | "_blank";
  children?: StorefrontMenuItem[];
};

export async function getStorefrontMenu(code: string): Promise<{ menu?: any; items: StorefrontMenuItem[] }> {
  const safe = encodeURIComponent(code);
  const res = await fetch(`${API_URL}/api/storefront/menus/${safe}`, {
    next: { revalidate: 5 },
    cache: typeof window === "undefined" ? undefined : "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch storefront menu");
  return res.json();
}
