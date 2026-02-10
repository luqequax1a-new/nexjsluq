import Image from "next/image";
import Link from "next/link";
import SectionHeader from "./SectionHeader";
import { getImageUrl } from "@/lib/media/getImageUrl";

export default function CollectionGridSection({ settings }: { settings: Record<string, any> }) {
    const collections = settings.collections || [];
    if (collections.length === 0) return null;
    const cols = settings.columns || "3";
    const showOverlay = settings.show_overlay !== false;

    return (
        <section style={{ paddingTop: settings.spacing_top || 60, paddingBottom: settings.spacing_bottom || 60 }}>
            <div className="container mx-auto px-4">
                <SectionHeader title={settings.title} subtitle={settings.subtitle} align={settings.title_align} />
                <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-4 md:gap-6`}>
                    {collections.map((item: any, i: number) => (
                        <Link
                            key={i}
                            href={item.url || "#"}
                            className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100"
                        >
                            {item.image && (
                                item.image.startsWith("data:") ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={item.image}
                                        alt={item.button_text || ""}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <Image
                                        src={getImageUrl(item.image)}
                                        alt={item.button_text || ""}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                )
                            )}
                            {showOverlay && (
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                            )}
                            {item.button_text && (
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                    <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                                        {item.button_text}
                                    </span>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
