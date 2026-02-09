import { apiFetch } from "@/lib/api";

export type Menu = {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
};

export type MenuItemType = "url" | "category";

export type MenuItemNode = {
  id: number;
  menu_id: number;
  parent_id: number | null;
  sort_order: number;
  type: MenuItemType;
  label: Record<string, string>;
  url: string | null;
  category_id: number | null;
  target: "_self" | "_blank";
  is_active: boolean;
  children: MenuItemNode[];
};

export async function getMenus(): Promise<{ menus: Menu[] }> {
  return apiFetch("/api/menus");
}

export async function createMenu(data: { name: string; code: string; is_active?: boolean }): Promise<{ menu: Menu }> {
  return apiFetch("/api/menus", { method: "POST", json: data });
}

export async function getMenu(id: number): Promise<{ menu: Menu }> {
  return apiFetch(`/api/menus/${id}`);
}

export async function getDefaultMenu(): Promise<{ menu: Menu }> {
  return apiFetch(`/api/menus/default`);
}

export async function getMenuByCode(code: string): Promise<{ menu: Menu }> {
  const safe = encodeURIComponent(String(code || '').trim());
  return apiFetch(`/api/menus/by-code/${safe}`);
}

export async function updateMenu(id: number, data: { name: string; code: string; is_active?: boolean }): Promise<{ menu: Menu }> {
  return apiFetch(`/api/menus/${id}`, { method: "PUT", json: data });
}

export async function deleteMenu(id: number): Promise<{ ok: true } | any> {
  return apiFetch(`/api/menus/${id}`, { method: "DELETE" });
}

export async function getMenuTree(id: number): Promise<{ items: MenuItemNode[] }> {
  return apiFetch(`/api/menus/${id}/tree`);
}

export async function reorderMenu(id: number, tree: Array<{ id: number; children?: any[] }>): Promise<{ ok: true } | any> {
  return apiFetch(`/api/menus/${id}/reorder`, { method: "PUT", json: { items: tree } });
}

export async function importMenuCategories(
  id: number,
  mode: 'replace' | 'append' = 'replace',
  max_depth?: number | null
): Promise<{ ok: true } | any> {
  const payload: any = { mode };
  if (typeof max_depth === 'number') payload.max_depth = max_depth;
  return apiFetch(`/api/menus/${id}/import-categories`, { method: 'POST', json: payload });
}

export async function createMenuItem(menuId: number, data: {
  parent_id?: number | null;
  type: MenuItemType;
  label: Record<string, string> | string;
  url?: string;
  category_id?: number;
  target?: "_self" | "_blank";
  is_active?: boolean;
}): Promise<any> {
  return apiFetch(`/api/menus/${menuId}/items`, { method: "POST", json: data });
}

export async function updateMenuItem(id: number, data: {
  type: MenuItemType;
  label: Record<string, string> | string;
  url?: string;
  category_id?: number;
  target?: "_self" | "_blank";
  is_active?: boolean;
}): Promise<any> {
  return apiFetch(`/api/menu-items/${id}`, { method: "PUT", json: data });
}

export async function deleteMenuItem(id: number): Promise<{ ok: true } | any> {
  return apiFetch(`/api/menu-items/${id}`, { method: "DELETE" });
}
