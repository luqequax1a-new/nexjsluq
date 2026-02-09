const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getStorefrontSettings() {
  const res = await fetch(`${API_URL}/api/storefront/settings`, {
    cache: 'no-store', // Disable caching to reflect changes immediately
  });
  if (!res.ok) throw new Error("Failed to fetch storefront settings");
  return res.json();
}
