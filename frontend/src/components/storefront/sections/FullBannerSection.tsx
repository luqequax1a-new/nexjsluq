import Image from "next/image";
import Link from "next/link";

export default function FullBannerSection({ settings }: { settings: Record<string, any> }) {
    const layout = settings.layout_type || "overlay";

    if (layout === "split") {
        return (
            <section style={{ paddingTop: settings.spacing_top || 0, paddingBottom: settings.spacing_bottom || 0 }}>
                <div className="container mx-auto px-4">
                    <div className="rounded-[32px] overflow-hidden flex flex-col md:flex-row items-center" style={{ background: settings.bg_color || "#6366f1" }}>
                        <div className="p-10 md:p-20 space-y-6 flex-1" style={{ color: settings.text_color || "#fff" }}>
                            {settings.title && <h2 className="text-4xl md:text-5xl font-heading font-extrabold">{settings.title}</h2>}
                            {settings.subtitle && <p className="text-lg max-w-lg opacity-80">{settings.subtitle}</p>}
                            {settings.button_text && (
                                <div className="pt-4">
                                    <Link href={settings.button_url || "#"} className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform inline-block">
                                        {settings.button_text}
                                    </Link>
                                </div>
                            )}
                        </div>
                        {settings.image && (
                            <div className="flex-1 w-full h-[300px] md:h-auto self-stretch relative">
                                <Image src={settings.image} alt={settings.title || ""} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                            </div>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative w-full overflow-hidden" style={{ paddingTop: settings.spacing_top || 0, paddingBottom: settings.spacing_bottom || 0 }}>
            {settings.image && (
                <div className="relative aspect-[21/9] md:aspect-[3/1]">
                    <Image src={settings.image} alt={settings.title || ""} fill className="object-cover" sizes="100vw" />
                    {layout === "overlay" && (
                        <>
                            <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${(settings.overlay_opacity || 30) / 100})` }} />
                            <div className="absolute inset-0 flex items-center">
                                <div className={`container mx-auto px-4 ${settings.text_position === "center" ? "text-center" : settings.text_position === "right" ? "text-right" : ""}`}>
                                    <div className="max-w-xl space-y-4" style={{ color: settings.text_color || "#fff", marginLeft: settings.text_position === "center" ? "auto" : undefined, marginRight: settings.text_position === "center" || settings.text_position === "right" ? "auto" : undefined }}>
                                        {settings.title && <h2 className="text-4xl md:text-5xl font-heading font-extrabold">{settings.title}</h2>}
                                        {settings.subtitle && <p className="text-lg opacity-80">{settings.subtitle}</p>}
                                        {settings.button_text && (
                                            <Link href={settings.button_url || "#"} className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform inline-block mt-4">
                                                {settings.button_text}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}
