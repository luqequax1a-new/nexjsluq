export default function RichTextSection({ settings }: { settings: Record<string, any> }) {
    const maxWidthMap: Record<string, string> = { sm: "640px", md: "768px", lg: "1024px", full: "100%" };
    const maxWidth = maxWidthMap[settings.max_width] || "768px";

    return (
        <section style={{ paddingTop: settings.spacing_top || 40, paddingBottom: settings.spacing_bottom || 40 }}>
            <div className="container mx-auto px-4">
                <div className={`prose prose-lg mx-auto ${settings.text_align === "center" ? "text-center" : ""}`} style={{ maxWidth }} dangerouslySetInnerHTML={{ __html: settings.content || "" }} />
            </div>
        </section>
    );
}
