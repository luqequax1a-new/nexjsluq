import React from "react";
import StorefrontChrome from "@/components/storefront/StorefrontChrome";
import StorefrontProviders from "@/components/storefront/StorefrontProviders";
import { CartProvider } from "@/context/CartContext";
import { SidebarCart } from "@/components/storefront/cart/SidebarCart";
import "@/styles/storefront.css";
import { getStorefrontSettings } from "@/lib/api/storefrontSettings";
import { getStorefrontMenu } from "@/lib/api/storefrontMenus";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    try {
        const s = await getStorefrontSettings();
        const title = s.store_meta_title || s.store_name || "Mağaza";
        const description = s.store_meta_description || "";

        return {
            title,
            description,
        };
    } catch {
        return {
            title: "Mağaza",
        };
    }
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
    let initialSettings: any = undefined;
    let initialMenus: any = undefined;
    try {
        initialSettings = await getStorefrontSettings();

        const codes = {
            primary: String(initialSettings?.storefront_primary_menu || "storefront_primary"),
            categories: String(initialSettings?.storefront_categories_menu || "storefront_categories"),
            categoriesTop: String(initialSettings?.storefront_categories_top_menu || "storefront_categories_top"),
            more: String(initialSettings?.storefront_more_menu || "storefront_more"),
        };

        const [p, c, top, more] = await Promise.all([
            getStorefrontMenu(codes.primary).catch(() => ({ items: [] })),
            getStorefrontMenu(codes.categories).catch(() => ({ items: [] })),
            getStorefrontMenu(codes.categoriesTop).catch(() => ({ items: [] })),
            getStorefrontMenu(codes.more).catch(() => ({ items: [] })),
        ]);

        initialMenus = {
            codes,
            primary: p.items || [],
            categories: c.items || [],
            categoriesTop: top.items || [],
            more: more.items || [],
        };
    } catch {
        initialSettings = undefined;
        initialMenus = undefined;
    }

    return (
        <StorefrontProviders locale="tr" initialSettings={initialSettings}>
            <CartProvider>
                <StorefrontChrome initialMenus={initialMenus}>{children}</StorefrontChrome>
                <SidebarCart />
            </CartProvider>
        </StorefrontProviders>
    );
}
