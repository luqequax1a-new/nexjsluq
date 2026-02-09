"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { StorefrontMenuItem } from "@/lib/api/storefrontMenus";

const MenuItem = ({ item, depth = 0 }: { item: StorefrontMenuItem; depth?: number }) => {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li
      className={`
        nav-item relative
        ${depth === 0 ? "h-full flex items-center" : "w-full"}
      `}
    >
      <Link
        href={item.url || "#"}
        className={`
          flex items-center justify-between transition-colors duration-200
          ${depth === 0
            ? "px-4 py-4 text-[14px] font-semibold text-gray-800 hover:text-primary"
            : "px-4 py-3 text-[14px] text-gray-700 hover:text-primary hover:bg-gray-50"
          }
        `}
      >
        <span className={depth > 0 ? "truncate" : ""}>{item.label}</span>
        {hasChildren && (
          depth === 0
            ? <ChevronDown className="ml-1 w-4 h-4 transition-transform duration-200" />
            : <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />
        )}
      </Link>

      {hasChildren && (
        <ul
          className={`
            nav-dropdown absolute bg-white border border-gray-100 shadow-xl rounded-lg py-2 min-w-[240px] z-50
            ${depth === 0
              ? "top-[calc(100%-5px)] left-0"
              : "top-[-8px] left-full ml-1"
            }
          `}
        >
          {item.children!.map((child) => (
            <MenuItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function DesktopNav({
  items,
  categories,
  align = "left",
}: {
  items: StorefrontMenuItem[];
  categories?: StorefrontMenuItem[];
  align?: "left" | "center";
}) {
  const menuItems = React.useMemo(() => {
    const cats = categories || [];
    const prim = items || [];

    const combined = [...cats];
    const existingIds = new Set(cats.map((c) => c.id));
    const existingUrls = new Set(cats.map((c) => c.url));

    prim.forEach((item) => {
      const isDuplicateId = existingIds.has(item.id);
      const isDuplicateUrl = item.url && item.url !== "#" && existingUrls.has(item.url);

      if (!isDuplicateId && !isDuplicateUrl) {
        combined.push(item);
      }
    });

    return combined;
  }, [items, categories]);

  return (
    <nav className="relative z-50 hidden lg:block border-t border-gray-100 bg-white">
      <style jsx global>{`
        .nav-item > .nav-dropdown {
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease-out;
          transform: translateY(10px);
        }
        .nav-item:hover > .nav-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>
      <div className="container mx-auto px-4">
        <ul className={`flex items-center gap-2 ${align === "center" ? "justify-center" : "justify-start"}`}>
          {menuItems.map((item) => (
            <MenuItem key={item.id} item={item} depth={0} />
          ))}
        </ul>
      </div>
    </nav>
  );
}
