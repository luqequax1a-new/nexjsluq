"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import AnnouncementBar from "@/components/storefront/header/AnnouncementBar";
import DesktopNav from "@/components/storefront/header/DesktopNav";
import DesktopTopBar from "@/components/storefront/header/DesktopTopBar";
import MobileBottomBar from "@/components/storefront/header/MobileBottomBar";
import MobileSidebar from "@/components/storefront/header/MobileSidebar";
import MobileTopBar from "@/components/storefront/header/MobileTopBar";
import SupportCenterModal from "@/components/storefront/support/SupportCenterModal";
import { getStorefrontMenu, type StorefrontMenuItem } from "@/lib/api/storefrontMenus";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";

type InitialMenus = {
    codes: {
        primary: string;
        categories: string;
        categoriesTop: string;
        more: string;
    };
    primary: StorefrontMenuItem[];
    categories: StorefrontMenuItem[];
    categoriesTop: StorefrontMenuItem[];
    more: StorefrontMenuItem[];
};

export default function Header({
    initialMenus,
}: {
    initialMenus?: InitialMenus;
}) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuState, setMobileMenuState] = useState<{ open: boolean; pathname: string }>({
        open: false,
        pathname: "",
    });
    const [supportState, setSupportState] = useState<{ open: boolean; pathname: string }>({
        open: false,
        pathname: "",
    });
    const [activeTab, setActiveTab] = useState<"categories" | "menu" | "more">("categories");
    const pathname = usePathname();
    const { t } = useI18n();
    const { settings } = useStorefrontSettings();

    const [primaryMenu, setPrimaryMenu] = useState<StorefrontMenuItem[]>(initialMenus?.primary || []);
    const [categoriesMenu, setCategoriesMenu] = useState<StorefrontMenuItem[]>(initialMenus?.categories || []);
    const desktopCatsAlign = useMemo<"left" | "center">(() => {
        return settings?.storefront_desktop_categories_alignment === "center" ? "center" : "left";
    }, [settings?.storefront_desktop_categories_alignment]);

    const mobileMenuOpen = mobileMenuState.open && mobileMenuState.pathname === pathname;
    const supportOpen = supportState.open && supportState.pathname === pathname;

    const menuCodes = useMemo(() => {
        const primary = String(settings?.storefront_primary_menu || initialMenus?.codes?.primary || "storefront_primary");
        const categories = String(settings?.storefront_categories_menu || initialMenus?.codes?.categories || "storefront_categories");
        return { primary, categories };
    }, [settings, initialMenus]);

    const showAnnouncement = useMemo(() => {
        const enabled = settings?.announcement_enabled === "true" || settings?.announcement_enabled === "1";
        const sticky = settings?.announcement_sticky === "true" || settings?.announcement_sticky === "1";
        if (!enabled) return false;
        if (!sticky && isScrolled) return false;
        return true;
    }, [settings, isScrolled]);

    useEffect(() => {
        const handleScroll = () => {
            const shouldBeSticky = window.scrollY > 10;
            setIsScrolled(shouldBeSticky);
        };

        handleScroll();

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [p, c] = await Promise.all([
                    getStorefrontMenu(menuCodes.primary),
                    getStorefrontMenu(menuCodes.categories),
                ]);
                if (!mounted) return;
                setPrimaryMenu(p.items || []);
                setCategoriesMenu(c.items || []);
            } catch {
                if (!mounted) return;
                if (!initialMenus) {
                    setPrimaryMenu([]);
                    setCategoriesMenu([]);
                }
            }
        })();
        return () => {
            mounted = false;
        };
    }, [menuCodes, initialMenus]);

    return (
        <>
            <header
                id="main-header"
                className={cn(
                    "sticky top-0 left-0 right-0 bg-white transition-all duration-300 z-[1000]",
                    isScrolled ? "shadow-sm border-b border-gray-100" : "border-b border-transparent"
                )}
            >
                <AnnouncementBar hidden={!showAnnouncement} />

                <div className="container mx-auto px-4 lg:px-6">
                    <DesktopTopBar searchPlaceholder={t("storefront.search.placeholder", "Urun Ara...")} />

                    <MobileTopBar
                        onOpenMenu={() => setMobileMenuState({ open: true, pathname: pathname || "" })}
                        onOpenSupport={() => setSupportState({ open: true, pathname: pathname || "" })}
                    />
                </div>

                <DesktopNav
                    items={primaryMenu}
                    categories={categoriesMenu}
                    align={desktopCatsAlign}
                />
            </header>

            <MobileSidebar
                open={mobileMenuOpen}
                activeTab={activeTab}
                onClose={() => setMobileMenuState((prev) => ({ ...prev, open: false }))}
                onTab={setActiveTab}
                menuItems={primaryMenu}
                categoryItems={categoriesMenu}
            />

            <SupportCenterModal open={supportOpen} onClose={() => setSupportState((prev) => ({ ...prev, open: false }))} />

            <MobileBottomBar />
        </>
    );
}
