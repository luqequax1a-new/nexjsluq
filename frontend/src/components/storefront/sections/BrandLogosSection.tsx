import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/media/getImageUrl";

export default function BrandLogosSection({ settings, brands }: { settings: Record<string, any>; brands: any[] }) {
    if (brands.length === 0) return null;

    return (
        <section style={{ paddingTop: settings.spacing_top || 40, paddingBottom: settings.spacing_bottom || 40 }}>
            <div className="container mx-auto px-4">
                {settings.title && <h2 className="text-2xl font-heading font-bold text-center mb-8">{settings.title}</h2>}
                <div className="flex items-center justify-center gap-12 flex-wrap">
                    {brands.map((brand: any) => (
                        <Link key={brand.id} href={`/marka/${brand.slug}`} className={`${settings.grayscale ? "grayscale hover:grayscale-0" : ""} transition-all opacity-60 hover:opacity-100`}>
                            {brand.image ? (
                                <Image src={getImageUrl(brand.image)} alt={brand.name} width={120} height={48} className="h-12 w-auto object-contain" />
                            ) : (
                                <span className="text-lg font-bold text-gray-400">{brand.name}</span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
