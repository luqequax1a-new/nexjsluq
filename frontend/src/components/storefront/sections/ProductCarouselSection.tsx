import type { Unit } from "@/hooks/useUnit";
import SectionHeader from "./SectionHeader";
import ProductCarousel from "./ProductCarousel";

export default function ProductCarouselSection({ settings, products, units }: { settings: Record<string, any>; products: any[]; units: Unit[] }) {
    if (products.length === 0) return null;
    const cols = Number(settings.columns) || 4;

    return (
        <section style={{ paddingTop: settings.spacing_top || 60, paddingBottom: settings.spacing_bottom || 60, background: settings.bg_color || "transparent" }}>
            <div className="container mx-auto px-4">
                <SectionHeader
                    title={settings.title}
                    subtitle={settings.subtitle}
                    align={settings.title_align}
                    viewAllUrl={settings.show_view_all ? settings.view_all_url : undefined}
                />
                <ProductCarousel
                    products={products}
                    units={units}
                    columns={cols}
                    layoutType={settings.layout_type || "carousel"}
                    showArrows={settings.show_arrows !== false}
                    showDots={settings.show_dots === true}
                />
            </div>
        </section>
    );
}
