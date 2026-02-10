export default function InfoCardsSection({ settings }: { settings: Record<string, any> }) {
    const cards = settings.cards || [];
    if (cards.length === 0) return null;
    const cols = settings.columns || "4";

    return (
        <section style={{ paddingTop: settings.spacing_top || 40, paddingBottom: settings.spacing_bottom || 40, background: settings.bg_color || "#f8fafc" }}>
            <div className="container mx-auto px-4">
                <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-6`}>
                    {cards.map((card: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                                {card.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{card.title}</h4>
                                <p className="text-gray-500 text-xs mt-0.5">{card.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
