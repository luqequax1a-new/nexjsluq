import Link from "next/link";
import SectionHeader from "./SectionHeader";
import { getImageUrl } from "@/lib/media/getImageUrl";

export default function MultiImageGridSection({ settings }: { settings: Record<string, any> }) {
    const items = settings.items || [];
    if (items.length === 0) return null;
    const cols = settings.columns || "4";

    return (
        <section style={{ paddingTop: settings.spacing_top || 60, paddingBottom: settings.spacing_bottom || 60, background: settings.bg_color || "transparent" }}>
            <div className="container mx-auto px-4">
                <SectionHeader title={settings.title} subtitle={settings.subtitle} align={settings.title_align} />
                <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-6`}>
                    {items.map((item: any, i: number) => {
                        const imgSrc = item.image?.startsWith("data:") ? item.image : getImageUrl(item.image);
                        const Wrapper = item.url ? Link : "div";
                        const wrapperProps = item.url ? { href: item.url } : {};

                        return (
                            <Wrapper key={i} {...(wrapperProps as any)} className="group space-y-3">
                                <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-100 border transition-transform group-hover:-translate-y-1">
                                    {item.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imgSrc} alt={item.title || ""} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl">📷</div>
                                    )}
                                </div>
                                {item.title && (
                                    <h3 className="font-bold text-center group-hover:text-primary transition-colors">{item.title}</h3>
                                )}
                            </Wrapper>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
