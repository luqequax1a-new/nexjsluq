import Link from "next/link";
import SectionHeader from "./SectionHeader";
import { getImageUrl } from "@/lib/media/getImageUrl";

export default function CategoryGridSection({ settings, categories }: { settings: Record<string, any>; categories: any[] }) {
    if (categories.length === 0) return null;
    const cols = settings.columns || "4";

    return (
        <section style={{ paddingTop: settings.spacing_top || 60, paddingBottom: settings.spacing_bottom || 60, background: settings.bg_color || "transparent" }}>
            <div className="container mx-auto px-4">
                <SectionHeader title={settings.title} subtitle={settings.subtitle} align={settings.title_align} />
                <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-6`}>
                    {categories.map((cat: any) => (
                        <Link key={cat.id} href={`/kategoriler/${cat.slug}`} className="group space-y-3">
                            <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-100 border transition-transform group-hover:-translate-y-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getImageUrl(cat.image)} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                            </div>
                            <h3 className="font-bold text-center group-hover:text-primary transition-colors">{cat.name}</h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
