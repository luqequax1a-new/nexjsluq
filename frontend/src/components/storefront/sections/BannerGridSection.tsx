import Image from "next/image";
import Link from "next/link";

export default function BannerGridSection({ settings }: { settings: Record<string, any> }) {
    const banners = settings.banners || [];
    if (banners.length === 0) return null;
    const gap = settings.gap || 16;

    return (
        <section style={{ paddingTop: settings.spacing_top || 40, paddingBottom: settings.spacing_bottom || 40 }}>
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap }}>
                    {banners.map((banner: any, i: number) => (
                        <Link key={i} href={banner.button_url || "#"} className="relative aspect-[16/9] rounded-2xl overflow-hidden group">
                            {banner.image && <Image src={banner.image} alt={banner.title || ""} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 100vw, 50vw" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-6 left-6 text-white">
                                {banner.title && <h3 className="text-2xl font-heading font-bold">{banner.title}</h3>}
                                {banner.button_text && <span className="text-sm font-semibold mt-2 inline-block opacity-80">{banner.button_text} →</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
