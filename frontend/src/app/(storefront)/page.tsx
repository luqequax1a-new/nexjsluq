import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { getHomeData } from "@/lib/api/storefront";
import T from "@/components/storefront/T";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-cat.jpg";
  const normalizeMediaPath = (p: string) => {
    if (p.startsWith("/media/")) return `/storage${p}`;
    if (p.startsWith("media/")) return `storage/${p}`;
    return p;
  };

  if (path.startsWith("http")) {
    const fixedHost = path.replace("http://127.0.0.1:8000", "http://localhost:8000");
    return fixedHost.replace("/media/", "/storage/media/");
  }

  const p = normalizeMediaPath(path);
  if (p.startsWith("/")) return `${API_URL}${p}`;
  return `${API_URL}/${p}`;
}

export default async function StorefrontHome() {
    const data = await getHomeData();
    const { categories, hero, new_arrivals } = data;

    return (
        <div className="space-y-20 pb-20">
            {/* Hero Section */}
            <section className="relative h-[600px] w-full overflow-hidden z-0">
                {hero && hero.length > 0 && (
                    <div className="absolute inset-0">
                        <Image
                            src={getImageUrl(hero[0].image)}
                            alt={hero[0].title}
                            fill
                            className="object-cover"
                            priority
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative">
                            <div className="max-w-2xl space-y-6 text-white ">
                                <h1 className="text-5xl md:text-7xl font-heading font-extrabold leading-tight">
                                    {hero[0].title}
                                </h1>
                                <p className="text-xl md:text-2xl text-white/90">
                                    {hero[0].subtitle}
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href={hero[0].link}
                                        className="bg-primary hover:bg-white hover:text-primary text-white px-8 py-4 rounded-xl font-bold transition-all inline-flex items-center gap-2 group"
                                    >
                                        {hero[0].button_text}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Category Grid */}
            <section className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-heading font-bold"><T k="storefront.home.popular_categories" fallback="Popüler Kategoriler" /></h2>
                        <p className="text-gray-500 mt-2">Dilediğiniz kumaşı kategorisine göre bulun.</p>
                    </div>
                    <Link href="/kategoriler" className="text-primary font-bold flex items-center gap-1 hover:underline">
                        <T k="storefront.common.view_all" fallback="Tümünü Gör" /> <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {categories.map((cat: any) => (
                        <Link key={cat.id} href={`/kategoriler/${cat.slug}`} className="group space-y-3">
                            <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-100 border transition-transform group-hover:-translate-y-1">
                                <Image
                                    src={getImageUrl(cat.image)}
                                    alt={cat.name}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-110"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                />
                            </div>
                            <h3 className="font-bold text-center group-hover:text-primary transition-colors">{cat.name}</h3>
                        </Link>
                    ))}
                </div>
            </section>

            {/* New Arrivals */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-heading font-bold text-secondary"><T k="storefront.home.new_arrivals" fallback="Yeni Gelenler" /></h2>
                            <p className="text-gray-500 mt-2">En taze dokular, en yeni renkler.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {new_arrivals.map((product: any) => (
                            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border group hover:shadow-xl transition-all">
                                <div className="aspect-[4/5] relative bg-gray-100">
                                    {product.media && product.media.length > 0 ? (
                                        <Image
                                            src={getImageUrl(product.media[0].path)}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            Görsel Yok
                                        </div>
                                    )}
                                    {product.selling_price < product.price && (
                                        <div className="absolute top-4 left-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                                            İNDİRİM
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 space-y-2">
                                    <h3 className="font-bold truncate text-lg group-hover:text-primary transition-colors">
                                        <Link href={`/urun/${product.slug}`}>{product.name}</Link>
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-primary font-extrabold text-xl">
                                            {product.selling_price} ₺
                                        </span>
                                        {product.selling_price < product.price && (
                                            <span className="text-gray-400 line-through text-sm">
                                                {product.price} ₺
                                            </span>
                                        )}
                                    </div>
                                    <button className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        <T k="storefront.product.add_to_cart" fallback="Sepete Ekle" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Campaign Banner */}
            <section className="container mx-auto px-4">
                <div className="bg-primary rounded-[32px] overflow-hidden flex flex-col md:flex-row items-center">
                    <div className="p-10 md:p-20 text-white space-y-6 flex-1">
                        <h2 className="text-4xl md:text-5xl font-heading font-extrabold">Modayı Kumaşından Keşfedin!</h2>
                        <p className="text-white/80 text-lg max-w-lg">
                            Yeni üyelere özel ilk alışverişte sepette ek %10 indirim fırsatını kaçırmayın.
                        </p>
                        <div className="pt-4">
                            <Link href="/kayit" className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform inline-block">
                                Hemen Üye Ol
                            </Link>
                        </div>
                    </div>
                    <div className="flex-1 w-full h-[300px] md:h-auto self-stretch relative">
                        <Image
                            src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"
                            alt="Campaign"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
