import type { Unit } from "@/hooks/useUnit";
import SectionHeader from "./SectionHeader";
import ProductCarousel from "./ProductCarousel";
import ProductTabsClient from "./ProductTabsClient";

export default function ProductTabsSection({ settings, tabs, products, units }: {
    settings: Record<string, any>;
    tabs: Array<{ title: string; products: any[] }>;
    products: any[];
    units: Unit[];
}) {
    const hasTabs = tabs.length > 0;
    const displayProducts = hasTabs ? tabs[0].products : products;
    if (displayProducts.length === 0 && !hasTabs) return null;
    const cols = Number(settings.columns) || 5;
    const rowCount = Number(settings.rows) || 2;

    return (
        <section style={{ paddingTop: settings.spacing_top || 60, paddingBottom: settings.spacing_bottom || 60, background: settings.bg_color || "transparent" }}>
            <div className="container mx-auto px-4">
                <SectionHeader
                    title={settings.title}
                    subtitle={settings.subtitle}
                    align={settings.title_align}
                />
                {hasTabs ? (
                    <ProductTabsClient tabs={tabs} units={units} columns={cols} rows={rowCount} />
                ) : (
                    <ProductCarousel
                        products={displayProducts}
                        units={units}
                        columns={cols}
                        rows={rowCount}
                        layoutType="carousel"
                        showArrows={true}
                        showDots={true}
                    />
                )}
            </div>
        </section>
    );
}
