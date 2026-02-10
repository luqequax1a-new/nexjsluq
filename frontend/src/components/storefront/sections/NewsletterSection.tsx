export default function NewsletterSection({ settings }: { settings: Record<string, any> }) {
    return (
        <section style={{ paddingTop: settings.spacing_top || 60, paddingBottom: settings.spacing_bottom || 60, background: settings.bg_color || "#f8fafc", color: settings.text_color || "#1e293b" }}>
            <div className="container mx-auto px-4 text-center max-w-xl">
                {settings.title && <h2 className="text-3xl font-heading font-bold mb-3">{settings.title}</h2>}
                {settings.subtitle && <p className="text-gray-500 mb-8">{settings.subtitle}</p>}
                <div className="flex gap-3">
                    <input type="email" placeholder={settings.placeholder || "E-posta adresiniz"} className="flex-1 px-5 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
                    <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
                        {settings.button_text || "Abone Ol"}
                    </button>
                </div>
            </div>
        </section>
    );
}
