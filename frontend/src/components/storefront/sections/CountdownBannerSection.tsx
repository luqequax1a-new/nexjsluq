import Link from "next/link";

export default function CountdownBannerSection({ settings }: { settings: Record<string, any> }) {
    return (
        <section style={{ paddingTop: settings.spacing_top || 40, paddingBottom: settings.spacing_bottom || 40 }}>
            <div className="container mx-auto px-4">
                <div
                    className="rounded-2xl p-10 md:p-16 text-center"
                    style={{ background: `linear-gradient(135deg, ${settings.bg_gradient_from || "#6366f1"}, ${settings.bg_gradient_to || "#f97316"})`, color: settings.text_color || "#fff" }}
                >
                    {settings.title && <h2 className="text-3xl md:text-4xl font-heading font-extrabold mb-4">{settings.title}</h2>}
                    {settings.subtitle && <p className="text-lg opacity-80 mb-8">{settings.subtitle}</p>}
                    {settings.button_text && (
                        <Link href={settings.button_url || "#"} className="bg-white/20 backdrop-blur text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all inline-block">
                            {settings.button_text}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
