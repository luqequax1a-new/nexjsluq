"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getStorefrontCategoriesTree } from "@/lib/api/storefrontCategories";
import { ChevronRight } from "lucide-react";
import type { StorefrontMenuItem } from "@/lib/api/storefrontMenus";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

type CategoryNode = {
  id: number | string;
  name: string;
  slug?: string;
  children?: CategoryNode[];
};

function normalizeCategoryTree(input: any): CategoryNode[] {
  const arr = Array.isArray(input)
    ? input
    : (Array.isArray(input?.data) ? input.data : (Array.isArray(input?.categories) ? input.categories : []));

  return (arr as any[]).map((n) => ({
    id: n?.id,
    name: String(n?.name ?? ""),
    slug: n?.slug,
    children: Array.isArray(n?.children) ? normalizeCategoryTree(n.children) : [],
  })).filter((n) => n.name.trim());
}

export default function MobileSidebar({
  open,
  activeTab,
  onClose,
  onTab,
  menuItems,
  categoryItems,
}: {
  open: boolean;
  activeTab: "categories" | "menu" | "more";
  onClose: () => void;
  onTab: (t: "categories" | "menu" | "more") => void;
  menuItems: StorefrontMenuItem[];
  categoryItems: StorefrontMenuItem[];
}) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { me } = useCustomerAuth();
  const isAuthed = !!me?.customer;
  const accountHref = isAuthed ? "/hesap" : "/giris?next=/hesap";

  useEffect(() => {
    if (!open) return;
    if (Array.isArray(categoryItems) && categoryItems.length > 0) return;
    let mounted = true;
    (async () => {
      try {
        setCatsLoading(true);
        const tree = await getStorefrontCategoriesTree();
        const normalized = normalizeCategoryTree(tree);
        if (mounted) setCategories(normalized);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, categoryItems]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categoryList = useMemo(() => categories.slice(0, 200), [categories]);

  const renderMenuTree = (nodes: StorefrontMenuItem[], depth: number, parentKey: string) => {
    return (
      <ul className={cn("flex flex-col", depth > 0 ? "pl-0" : "")}
      >
        {nodes.map((it) => {
          const hasChildren = Array.isArray(it.children) && it.children.length > 0;
          const key = `${parentKey}${String(it.id)}`;
          const isOpen = !!expanded[key];
          const href = it.url || "#";

          return (
            <li
              key={key}
              className={cn(
                "relative border-b border-gray-50 last:border-0",
                hasChildren ? "cursor-pointer" : "",
                isOpen ? "text-primary" : ""
              )}
              onClick={() => {
                if (hasChildren) toggleExpand(key);
              }}
            >
              {isOpen ? (
                <span className="absolute left-0 top-[16px] h-[15px] w-[7px] bg-primary rounded-tr-xl rounded-br-xl" />
              ) : null}

              <div className="flex items-center justify-between px-4 h-[52px]">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={href}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!it.url) {
                        e.preventDefault();
                        return;
                      }
                      onClose();
                    }}
                    className={cn(
                      "text-[14px] font-medium text-[#0e1e3e] truncate transition-colors",
                      isOpen ? "text-primary" : "hover:text-primary"
                    )}
                  >
                    {it.label}
                  </Link>
                </div>

                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpand(key);
                    }}
                    className="w-8 h-8 flex items-center justify-center"
                    aria-label="Alt menüyü aç/kapat"
                  >
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 transition-transform",
                        isOpen ? "rotate-90 text-primary" : "rotate-0 text-gray-400"
                      )}
                    />
                  </button>
                ) : (
                  <span className="w-8" />
                )}
              </div>

              {hasChildren && isOpen ? (
                <div className="pb-2 pl-8">
                  {renderMenuTree(it.children || [], depth + 1, `${key}-`)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderCats = (nodes: CategoryNode[], depth: number, parentKey: string) => {
    return (
      <ul className={cn("flex flex-col", depth > 0 ? "pl-0" : "")}>
        {nodes.map((c) => {
          const hasChildren = Array.isArray(c.children) && c.children.length > 0;
          const key = `${parentKey}${String(c.id)}`;
          const isOpen = !!expanded[key];
          const href = c.slug ? `/kategoriler/${c.slug}` : "#";
          return (
            <li
              key={key}
              className={cn(
                "relative border-b border-gray-50 last:border-0",
                hasChildren ? "cursor-pointer" : "",
                isOpen ? "text-primary" : ""
              )}
              onClick={() => {
                if (hasChildren) toggleExpand(key);
              }}
            >
              {isOpen ? (
                <span className="absolute left-0 top-[16px] h-[15px] w-[7px] bg-primary rounded-tr-xl rounded-br-xl" />
              ) : null}

              <div className="flex items-center justify-between px-4 h-[52px]">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={href}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!c.slug) {
                        e.preventDefault();
                        return;
                      }
                      onClose();
                    }}
                    className={cn(
                      "text-[14px] font-medium text-[#0e1e3e] truncate transition-colors",
                      isOpen ? "text-primary" : "hover:text-primary"
                    )}
                  >
                    {c.name}
                  </Link>
                </div>

                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpand(key);
                    }}
                    className="w-8 h-8 flex items-center justify-center"
                    aria-label="Alt menüyü aç/kapat"
                  >
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 transition-transform",
                        isOpen ? "rotate-90 text-primary" : "rotate-0 text-gray-400"
                      )}
                    />
                  </button>
                ) : (
                  <span className="w-8" />
                )}
              </div>

              {hasChildren && isOpen ? (
                <div className="pb-2 pl-8">
                  {renderCats(c.children || [], depth + 1, `${key}-`)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={cn("fixed inset-0 z-[2000] lg:hidden", open ? "visible" : "invisible pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "absolute inset-y-0 left-[-150px] w-[317px] bg-white shadow-2xl flex flex-col transition-all duration-200 ease-out overflow-visible",
          open ? "opacity-100 visible translate-x-[150px]" : "opacity-0 invisible translate-x-0"
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="group absolute right-[-26px] top-[21px] w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center cursor-pointer shadow-none border-0 outline-none pointer-events-auto"
        >
          <i className="las la-times text-[18px] text-[#00316c] transition-colors group-hover:text-primary" />
        </button>

        <div className="h-[63px] pt-5 px-4 bg-primary/10">
          <div className="flex bg-primary/10 rounded-[10px] p-[2px]">
            {([
              { key: "categories", label: "Kategoriler" },
              { key: "menu", label: "Menü" },
              { key: "more", label: "Daha" },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onTab(t.key)}
                className={cn(
                  "flex-1 text-[12px] leading-[12px] py-[10px] rounded-lg transition-colors text-center",
                  activeTab === t.key ? "bg-primary text-white cursor-default" : "text-gray-600 hover:text-gray-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-2">
          {activeTab === "categories" && (
            <div className="px-2">
              {Array.isArray(categoryItems) && categoryItems.length > 0 ? (
                renderMenuTree(categoryItems, 0, "catmenu-")
              ) : catsLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500">Yükleniyor...</div>
              ) : categoryList.length ? (
                renderCats(categoryList, 0, "cat-")
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">Kategori bulunamadı.</div>
              )}
            </div>
          )}

          {activeTab === "menu" && (
            <div className="px-2">
              {menuItems?.length ? (
                renderMenuTree(menuItems, 0, "menu-")
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">Menü bulunamadı.</div>
              )}
            </div>
          )}

          {activeTab === "more" && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={accountHref}
                  onClick={onClose}
                  className="flex flex-col items-center justify-center h-[110px] border border-[#e2e8f0] rounded-xl hover:border-primary transition-colors bg-white"
                >
                  <span className="text-[13px] text-[#0e1e3e]">Hesabım</span>
                </Link>
                <Link
                  href="/iletisim"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center h-[110px] border border-[#e2e8f0] rounded-xl hover:border-primary transition-colors bg-white"
                >
                  <span className="text-[13px] text-[#0e1e3e]">İletişim</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
