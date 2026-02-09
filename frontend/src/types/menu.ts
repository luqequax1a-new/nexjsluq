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
