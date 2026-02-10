import Image from "next/image";
import Link from "next/link";

export default function HeroSliderSection({ settings }: { settings: Record<string, any> }) {
    const slides = settings.slides || [];
    if (slides.length === 0) return null;

    const overlayOpacity = (settings.overlay_opacity ?? 30) / 100;

    return (
        <section className="home-section-wrap">
            <div className="home-slider-wrap" style={{
                maxWidth: 1400, margin: "0 auto", borderRadius: 8, overflow: "hidden",
                height: 520,
                position: "relative", background: "#0e0e10",
            }}>
                <HeroSliderClient slides={slides} settings={settings} overlayOpacity={overlayOpacity} />
            </div>
        </section>
    );
}

function HeroSliderClient({ slides, settings, overlayOpacity }: { slides: any[]; settings: Record<string, any>; overlayOpacity: number }) {
    const slideCount = slides.length;
    const slide = slides[0];
    const textPos = slide.text_position || "left";

    const getAlignClass = () => {
        if (textPos === "center") return "slide-align-center";
        if (textPos === "right") return "slide-align-right";
        return "slide-align-left";
    };

    return (
        <>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {slide.image && (
                    <Image src={slide.image} alt={slide.title || ""} fill className="object-cover" priority sizes="100vw" />
                )}
                <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />

                <div className={`hero-slide-content ${getAlignClass()}`}>
                    <div className="hero-captions">
                        {slide.title && <h1 className="hero-caption-1">{slide.title}</h1>}
                        {slide.subtitle && <p className="hero-caption-2">{slide.subtitle}</p>}
                        {slide.button_text && (
                            <div className="hero-slide-action">
                                <Link href={slide.button_url || "#"} className="hero-slide-button">
                                    {slide.button_text}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {settings.show_dots !== false && slideCount > 1 && (
                    <div className="hero-dots">
                        {slides.map((_: any, i: number) => (
                            <span key={i} className={`hero-dot ${i === 0 ? "active" : ""}`} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .home-section-wrap { margin-top: 30px; }
                .hero-slide-content {
                    position: absolute; top: 0; display: flex; height: 100%; width: 100%;
                }
                .hero-slide-content.slide-align-left {
                    left: 0; justify-content: flex-start; align-items: center;
                }
                .hero-slide-content.slide-align-left .hero-captions {
                    margin-left: 60px; text-align: left;
                }
                .hero-slide-content.slide-align-left .hero-caption-2 { margin-right: 90px; }
                .hero-slide-content.slide-align-right {
                    right: 0; justify-content: flex-end; align-items: center;
                }
                .hero-slide-content.slide-align-right .hero-captions {
                    margin-right: 60px; text-align: right;
                }
                .hero-slide-content.slide-align-right .hero-caption-2 { margin-left: 90px; }
                .hero-slide-content.slide-align-center {
                    left: 0; right: 0; justify-content: center; align-items: flex-end;
                    padding-bottom: 60px;
                }
                .hero-slide-content.slide-align-center .hero-captions {
                    text-align: center; margin: 0; width: 80%;
                }
                .hero-slide-content.slide-align-center .hero-caption-2 {
                    margin-left: auto; margin-right: auto;
                }
                .hero-captions { width: 460px; max-width: 80%; }
                .hero-caption-1 {
                    font-size: 48px; font-weight: 300; line-height: 48px; color: #fff;
                    display: block; margin: 0;
                }
                .hero-caption-2 {
                    font-size: 16px; line-height: 26px; color: rgba(255,255,255,0.7);
                    margin-top: 20px;
                }
                .hero-slide-action { margin-top: 25px; display: flex; justify-content: inherit; }
                .hero-slide-button {
                    padding: 8px 25px; font-size: 13px; font-weight: 600;
                    background: #ffffff; color: #111827; border-radius: 4px;
                    text-decoration: none; display: inline-block;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.3s;
                }
                .hero-slide-button:hover {
                    background: #f8fafc; transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0,0,0,0.12);
                }
                .hero-dots {
                    position: absolute; bottom: 25px; right: 23px;
                    display: flex; align-items: center; gap: 4px;
                }
                .hero-dot {
                    height: 8px; width: 8px; border-radius: 4px;
                    background: rgba(99,102,241,0.3); transition: all 0.15s;
                    display: inline-block;
                }
                .hero-dot.active { width: 25px; background: rgba(99,102,241,1); }

                @media (max-width: 1600px) { .home-slider-wrap { height: 480px !important; } }
                @media (max-width: 1500px) { .home-slider-wrap { height: 460px !important; } }
                @media (max-width: 1400px) { .home-slider-wrap { height: 430px !important; } }
                @media (max-width: 1300px) { .home-slider-wrap { height: 400px !important; } }
                @media (max-width: 1199px) { .home-slider-wrap { height: 430px !important; } }
                @media (max-width: 767px) {
                    .home-slider-wrap { height: 400px !important; }
                    .hero-caption-1 { font-size: 38px; line-height: 38px; }
                    .hero-caption-2 { font-size: 15px; line-height: 25px; margin-top: 15px; }
                }
                @media (max-width: 576px) {
                    .home-slider-wrap { height: 350px !important; }
                    .hero-slide-content.slide-align-left .hero-captions { margin: 0 50px 0 40px; }
                    .hero-slide-content.slide-align-left .hero-caption-2 { margin-right: 0; }
                    .hero-slide-content.slide-align-right .hero-captions { margin: 0 40px 0 50px; }
                    .hero-slide-content.slide-align-right .hero-caption-2 { margin-left: 0; }
                    .hero-caption-1 { font-size: 28px; line-height: 28px; }
                    .hero-caption-2 { font-size: 14px; line-height: 24px; }
                }
                @media (max-width: 450px) {
                    .home-slider-wrap { height: 300px !important; }
                    .hero-slide-content.slide-align-left .hero-captions,
                    .hero-slide-content.slide-align-right .hero-captions { margin: 0 30px !important; }
                }
                @media (max-width: 400px) { .home-slider-wrap { height: 250px !important; } }
            `}</style>
        </>
    );
}
