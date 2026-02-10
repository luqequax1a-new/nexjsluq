"use client";

import React, { forwardRef, useRef, useEffect } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import type { PageSection, ResponsiveMode } from "@/types/sectionBuilder";
import { SectionIcon } from "../utils/sectionIcons";

interface PreviewFrameProps {
  responsiveMode: ResponsiveMode;
  onResponsiveModeChange: (mode: ResponsiveMode) => void;
  sections: PageSection[];
  selectedSectionId: number | null;
  onSelectSection?: (id: number) => void;
}

const RESPONSIVE_WIDTHS: Record<ResponsiveMode, string> = {
  mobile: "393px",
  tablet: "768px",
  desktop: "100%",
};

export const PreviewFrame = forwardRef<HTMLIFrameElement, PreviewFrameProps>(
  function PreviewFrame({ responsiveMode, onResponsiveModeChange, sections, selectedSectionId, onSelectSection }, ref) {
    const iframeWidth = RESPONSIVE_WIDTHS[responsiveMode];
    const isFramed = responsiveMode !== "desktop";
    const selectedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (selectedRef.current) {
        selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [selectedSectionId]);

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Preview Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: isFramed ? "flex-start" : "stretch",
            padding: isFramed ? "24px" : "0",
            overflow: "auto",
            background: isFramed ? "#e2e8f0" : "#f1f5f9",
          }}
        >
          <div
            style={{
              width: iframeWidth,
              maxWidth: "100%",
              height: isFramed ? "calc(100vh - 160px)" : "100%",
              background: "#ffffff",
              borderRadius: isFramed ? 16 : 0,
              boxShadow: isFramed ? "0 25px 50px -12px rgba(0,0,0,0.15)" : "none",
              overflow: "hidden",
              transition: "width 300ms ease, border-radius 300ms ease",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", paddingTop: 12 }}>
              {sections.length === 0 ? (
                <EmptyPreview />
              ) : (
                sections.map((section) => (
                  <LiveSectionPreview
                    key={section.id}
                    ref={section.id === selectedSectionId ? selectedRef : undefined}
                    section={section}
                    isSelected={section.id === selectedSectionId}
                    onClick={() => onSelectSection?.(section.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Responsive Toggle */}
        <div style={{ padding: "10px 0", display: "flex", justifyContent: "center", background: "#f1f5f9", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "inline-flex", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: 3, gap: 2 }}>
            {(["mobile", "tablet", "desktop"] as ResponsiveMode[]).map((mode) => {
              const icons = { mobile: <Smartphone size={16} />, tablet: <Tablet size={16} />, desktop: <Monitor size={16} /> };
              const labels = { mobile: "393px", tablet: "768px", desktop: "100%" };
              const isActive = mode === responsiveMode;
              return (
                <button
                  key={mode}
                  onClick={() => onResponsiveModeChange(mode)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                    border: "none", borderRadius: 8,
                    background: isActive ? "#1f2937" : "transparent",
                    color: isActive ? "#fff" : "#6b7280",
                    fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {icons[mode]} {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

function EmptyPreview() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400, color: "#9ca3af", gap: 12 }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <line x1="2" y1="8" x2="22" y2="8" />
        <line x1="2" y1="14" x2="22" y2="14" />
      </svg>
      <span style={{ fontSize: 14 }}>Henüz bölüm eklenmedi</span>
      <span style={{ fontSize: 12 }}>Sol panelden bölüm ekleyerek başlayın</span>
    </div>
  );
}

// ─── LIVE SECTION PREVIEW ───
const LiveSectionPreview = forwardRef<HTMLDivElement, {
  section: PageSection;
  isSelected: boolean;
  onClick: () => void;
}>(function LiveSectionPreview({ section, isSelected, onClick }, ref) {
  const s = section.settings || {};
  const key = section.template?.key || "";

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    opacity: section.is_active ? 1 : 0.35,
    outline: isSelected ? "2px solid #6366f1" : "2px solid transparent",
    outlineOffset: -2,
    transition: "outline 0.15s, opacity 0.2s",
    cursor: "pointer",
  };

  return (
    <div ref={ref} style={wrapperStyle} onClick={onClick}>
      {isSelected && key !== "marquee_banner" && (
        <div style={{ position: "absolute", top: 6, left: 6, background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, zIndex: 10, display: "flex", alignItems: "center", gap: 4 }}>
          <SectionIcon templateKey={key} size={12} />
          {section.template?.name}
        </div>
      )}

      {key === "hero_slider" && <HeroPreview s={s} />}
      {key === "marquee_banner" && <MarqueePreview s={s} />}
      {key === "category_grid" && <GridPreview s={s} title={s.title || "Popüler Kategoriler"} count={Number(s.limit) || 8} colCount={Number(s.columns) || 4} shape={s.layout_style === "grid-round" ? "round" : "square"} />}
      {key === "product_carousel" && <ProductGridPreview s={s} />}
      {key === "product_tabs" && <ProductGridPreview s={s} showTabs />}
      {key === "full_banner" && <FullBannerPreview s={s} />}
      {key === "banner_grid" && <BannerGridPreview s={s} />}
      {key === "collection_grid" && <CollectionGridPreview s={s} />}
      {key === "multi_image_grid" && <MultiImageGridPreview s={s} />}
      {key === "countdown_banner" && <CountdownPreview s={s} />}
      {key === "info_cards" && <InfoCardsPreview s={s} />}
      {key === "brand_logos" && <BrandLogosPreview s={s} />}
      {key === "testimonials" && <TestimonialsPreview s={s} />}
      {key === "newsletter" && <NewsletterPreview s={s} />}
      {key === "faq_accordion" && <FaqPreview s={s} />}
      {key === "rich_text" && <RichTextPreview s={s} />}
      {key === "video_hero" && <HeroPreview s={s} isVideo />}

      {!section.is_active && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, letterSpacing: 1 }}>
          GİZLİ
        </div>
      )}
    </div>
  );
});

// ─── HERO SLIDER (FleetCart exact responsive dimensions) ───
function HeroPreview({ s, isVideo }: { s: Record<string, any>; isVideo?: boolean }) {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(1000);
  const slides: any[] = s.slides || [];
  const slideCount = slides.length;
  const slide = slides[activeSlide] || slides[0] || {};

  // Settings
  const overlayOpacity = (s.overlay_opacity ?? 30) / 100;
  const showDots = s.show_dots !== false;
  const showArrows = s.show_arrows !== false;
  const autoplay = s.autoplay !== false;
  const transitionEffect = s.transition_effect || "fade";
  const textPos = slide.text_position || "left";
  const hasImage = !!slide.image;

  // Measure container width for responsive height
  React.useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // FleetCart exact responsive breakpoints (container-width based)
  const getSliderHeight = (w: number): number => {
    if (w <= 400) return 250;
    if (w <= 450) return 300;
    if (w <= 576) return 350;
    if (w <= 767) return 400;
    if (w <= 1199) return 430;
    if (w <= 1300) return 400;
    if (w <= 1400) return 430;
    if (w <= 1500) return 460;
    if (w <= 1600) return 480;
    return 520;
  };

  const sliderHeight = getSliderHeight(containerWidth);

  // Responsive text sizes
  const isMobile = containerWidth <= 576;
  const isTablet = containerWidth <= 768;
  const titleSize = isMobile ? 24 : isTablet ? 32 : 48;
  const subtitleSize = isMobile ? 13 : 16;
  const captionMargin = isMobile ? 20 : isTablet ? 35 : 60;
  const captionWidth = isMobile ? "85%" : isTablet ? "70%" : 460;

  // Autoplay
  React.useEffect(() => {
    if (!autoplay || slideCount <= 1) return;
    const speed = Number(s.autoplay_speed) || 5000;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideCount);
    }, Math.max(speed, 1500));
    return () => clearInterval(interval);
  }, [autoplay, slideCount, s.autoplay_speed]);

  React.useEffect(() => {
    if (activeSlide >= slideCount && slideCount > 0) setActiveSlide(0);
  }, [slideCount, activeSlide]);

  const goTo = (idx: number) => setActiveSlide(Math.max(0, Math.min(idx, slideCount - 1)));

  const containerStyle: React.CSSProperties = {
    position: "relative",
    background: "#0e0e10",
    overflow: "hidden",
    transition: "height 0.3s ease",
    borderRadius: 8,
    maxWidth: 1400,
    margin: "0 auto",
    height: sliderHeight,
  };

  if (slideCount === 0) {
    return (
      <div ref={heroRef} style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, minHeight: 250 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
          <SectionIcon templateKey={isVideo ? "video_hero" : "hero_slider"} size={24} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Slide ekleyerek başlayın</div>
      </div>
    );
  }

  // FleetCart text position styles
  const getContentStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute", top: 0, display: "flex", height: "100%", width: "100%",
    };
    if (textPos === "center") {
      return { ...base, left: 0, right: 0, justifyContent: "center", alignItems: "flex-end", paddingBottom: isMobile ? 30 : 60 };
    }
    if (textPos === "right") {
      return { ...base, right: 0, justifyContent: "flex-end", alignItems: "center" };
    }
    return { ...base, left: 0, justifyContent: "flex-start", alignItems: "center" };
  };

  const getCaptionsStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { width: captionWidth, maxWidth: "90%" };
    if (textPos === "center") {
      return { ...base, textAlign: "center", margin: 0, width: "85%" };
    }
    if (textPos === "right") {
      return { ...base, marginRight: captionMargin, textAlign: "right" };
    }
    return { ...base, marginLeft: captionMargin, textAlign: "left" };
  };

  // Arrow size responsive
  const arrowSize = isMobile ? 24 : 30;

  return (
    <div
      ref={heroRef}
      style={containerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background Image */}
      {hasImage && (
        <img
          key={`slide-img-${activeSlide}`}
          src={slide.image}
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            animation: transitionEffect === "none" ? "none" : transitionEffect === "zoom" ? "heroZoomIn 0.6s ease forwards" : transitionEffect === "fade" ? "heroFadeIn 0.5s ease" : "heroSlideIn 0.4s ease",
          }}
        />
      )}

      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, transition: "background 0.3s ease" }} />

      {/* Content — FleetCart layout */}
      <div style={getContentStyle()}>
        <div style={getCaptionsStyle()}>
          {slide.title && (
            <div style={{
              fontSize: titleSize, fontWeight: 300, lineHeight: `${titleSize}px`, color: "#fff",
              display: "block", transition: "font-size 0.2s ease",
            }}>
              {slide.title}
            </div>
          )}
          {slide.subtitle && (
            <div style={{
              fontSize: subtitleSize, lineHeight: "1.6", color: "rgba(255,255,255,0.7)",
              marginTop: isMobile ? 10 : 20,
              ...(textPos === "left" && !isMobile ? { marginRight: 90 } : textPos === "right" && !isMobile ? { marginLeft: 90 } : {}),
            }}>
              {slide.subtitle}
            </div>
          )}
          {slide.button_text && (
            <div style={{ marginTop: isMobile ? 15 : 25, display: "flex", justifyContent: "inherit" }}>
              <div style={{
                padding: isMobile ? "6px 16px" : "8px 25px", fontSize: 13, fontWeight: 600,
                background: "#ffffff", color: "#111827", borderRadius: 4,
                textDecoration: "none", display: "inline-block",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                cursor: "default",
              }}>
                {slide.button_text}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Arrows — FleetCart: round, hidden by default, visible on hover */}
      {showArrows && slideCount > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goTo((activeSlide - 1 + slideCount) % slideCount); }}
            style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              left: hovered ? 15 : -35,
              width: arrowSize, height: arrowSize, borderRadius: "50%", border: "none",
              background: "rgba(99,102,241,0.3)", color: "#fff", fontSize: isMobile ? 10 : 12,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease", fontWeight: 600,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.3)")}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goTo((activeSlide + 1) % slideCount); }}
            style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              right: hovered ? 15 : -35,
              width: arrowSize, height: arrowSize, borderRadius: "50%", border: "none",
              background: "rgba(99,102,241,0.3)", color: "#fff", fontSize: isMobile ? 10 : 12,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease", fontWeight: 600,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.3)")}
          >
            ›
          </button>
        </>
      )}

      {/* Dots — FleetCart: bottom-right, 8px bullets, active 25px wide */}
      {showDots && slideCount > 1 && (
        <div style={{
          position: "absolute", bottom: isMobile ? 12 : 25, right: isMobile ? 12 : 23,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              style={{
                width: i === activeSlide ? 25 : 8, height: 8, borderRadius: 4, border: "none",
                background: i === activeSlide ? "rgba(99,102,241,1)" : "rgba(99,102,241,0.3)",
                cursor: "pointer", transition: "all 0.15s ease", padding: 0, opacity: 1,
              }}
            />
          ))}
        </div>
      )}

      {/* Autoplay indicator */}
      {autoplay && slideCount > 1 && (
        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          Otomatik
        </div>
      )}

      {/* Slide counter */}
      {slideCount > 1 && (
        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", color: "#fff", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
          {activeSlide + 1} / {slideCount}
        </div>
      )}

      {/* Video badge */}
      {isVideo && (
        <div style={{ position: "absolute", top: 12, right: 100, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          ▶ VIDEO
        </div>
      )}

      {/* Transition effect CSS */}
      <style>{`
        @keyframes heroFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes heroSlideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes heroZoomIn { from { transform: scale(1.1); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─── MARQUEE (Swiper-style slide per message) ───
function MarqueePreview({ s }: { s: Record<string, any> }) {
  const items: { text?: string }[] = s.items || [];
  const messages = items.filter((i) => i.text?.trim());
  const bgColor = s.bg_color || "#ee8bb9";
  const textColor = s.text_color || "#fff";
  const fontSize = Number(s.font_size) || 13;
  const height = Number(s.height) || 41;
  const autoplaySpeed = (Number(s.autoplay_speed) || 4) * 1000;

  const [activeIndex, setActiveIndex] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval>>();

  // Autoplay: cycle through messages
  React.useEffect(() => {
    if (messages.length <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, autoplaySpeed);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [messages.length, autoplaySpeed]);

  // Reset index if messages change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div style={{ background: bgColor, height, overflow: "hidden" }} />
    );
  }

  return (
    <div style={{
      background: bgColor, height, overflow: "hidden", position: "relative",
    }}>
      {/* Slide wrapper */}
      <div style={{
        display: "flex", width: `${messages.length * 100}%`,
        transform: `translate3d(-${activeIndex * (100 / messages.length)}%, 0, 0)`,
        transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        height: "100%",
      }}>
        {messages.map((item, i) => (
          <div
            key={i}
            style={{
              width: `${100 / messages.length}%`, height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div style={{
              color: textColor, fontSize, fontWeight: 700,
              textAlign: "center", width: "75%", lineHeight: 1.3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {item.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PRODUCT GRID (live preview with real data + arrows/dots) ───
function ProductGridPreview({ s, showTabs }: { s: Record<string, any>; showTabs?: boolean }) {
  const desktopCols = Number(s.columns) || (showTabs ? 5 : 4);
  const rowCount = Number(s.rows) || (showTabs ? 2 : 1);
  const limit = showTabs ? desktopCols * rowCount : (Number(s.limit) || 10);
  const titleAlign = s.title_align || "left";
  const source = s.source || "latest";
  const categoryId = s.category_id;
  const brandId = s.brand_id;
  const tagId = s.tag_id;
  const productIds = s.product_ids;
  const layoutType = showTabs ? "grid" : (s.layout_type || "carousel");
  const showArrows = showTabs ? false : (s.show_arrows !== false);
  const showDots = showTabs ? false : (s.show_dots === true);

  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const fetchRef = React.useRef<ReturnType<typeof setTimeout>>();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [containerWidth, setContainerWidth] = React.useState(800);

  // Responsive: measure container width
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Responsive column count: <480px → 2, <768px → min(cols,3), else → cols
  const cols = containerWidth < 480 ? 2 : containerWidth < 768 ? Math.min(desktopCols, 3) : desktopCols;

  // Build API URL based on source
  const buildApiUrl = React.useCallback(() => {
    const params = new URLSearchParams();
    params.set("per_page", String(Math.min(limit, 20)));

    if (source === "category" && categoryId) {
      params.set("category_id", String(categoryId));
    } else if (source === "brand" && brandId) {
      params.set("brand_id", String(brandId));
    } else if (source === "manual" && productIds) {
      const ids = Array.isArray(productIds) ? productIds : String(productIds).split(",").filter(Boolean);
      ids.forEach((id: any) => params.append("ids[]", String(id)));
    } else if (source === "tag" && tagId) {
      params.set("tag_id", String(tagId));
    } else if (source === "featured") {
      params.set("is_featured", "1");
    } else if (source === "on_sale") {
      params.set("on_sale", "1");
    }
    return `/api/products?${params.toString()}`;
  }, [source, categoryId, brandId, tagId, productIds, limit]);

  // Fetch products when settings change
  React.useEffect(() => {
    if (fetchRef.current) clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { apiFetch } = await import("@/lib/api");
        const url = buildApiUrl();
        const res = await apiFetch<any>(url);
        const items = res.data || res.items || res || [];
        setProducts(Array.isArray(items) ? items : []);
      } catch {
        setProducts([]);
      }
      setLoading(false);
    }, 200);
    return () => { if (fetchRef.current) clearTimeout(fetchRef.current); };
  }, [buildApiUrl]);

  // Carousel scroll state tracking
  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sl = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(sl > 2);
    setCanScrollRight(sl < maxScroll - 2);
    // Calculate current page
    const itemWidth = el.scrollWidth / products.length;
    const page = Math.round(sl / (itemWidth * cols));
    setCurrentPage(page);
  }, [products.length, cols]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || layoutType !== "carousel") return;
    // Delay initial check until after browser layout
    const raf = requestAnimationFrame(() => updateScrollState());
    const timer = setTimeout(updateScrollState, 300);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [layoutType, updateScrollState, products]);

  // Total pages for dots
  const totalPages = Math.max(1, Math.ceil(products.slice(0, limit).length / cols));

  // Scroll by one page (cols items)
  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = el.scrollWidth / products.slice(0, limit).length;
    const scrollAmount = itemWidth * cols * dir;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Scroll to specific page
  const scrollToPage = (page: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = el.scrollWidth / products.slice(0, limit).length;
    el.scrollTo({ left: itemWidth * cols * page, behavior: "smooth" });
  };

  // Get product image
  const getProductImage = (product: any): string | null => {
    if (product.media && product.media.length > 0) {
      const m = product.media[0];
      return m.url || m.original_url || m.path || null;
    }
    if (product.image) return product.image;
    return null;
  };

  // Format price
  const formatPrice = (price: any): string => {
    const num = Number(price);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(num);
  };

  // Header alignment
  const headerAlign: React.CSSProperties["textAlign"] = titleAlign === "center" ? "center" : titleAlign === "right" ? "right" : "left";
  const headerJustify = titleAlign === "center" ? "center" : titleAlign === "right" ? "flex-end" : "space-between";

  // Source label
  const sourceLabels: Record<string, string> = {
    latest: "Yeni Gelenler", featured: "Öne Çıkan", bestseller: "Çok Satanlar",
    on_sale: "İndirimli", category: "Kategoriye Göre", brand: "Markaya Göre", tag: "Etikete Göre", manual: "Manuel Seçim",
  };

  // Unique ID for hiding scrollbar
  const carouselId = React.useId();

  // Arrow button style (smaller on narrow containers)
  const arrowSize = containerWidth < 480 ? 32 : 40;
  const arrowBtnStyle = (disabled: boolean): React.CSSProperties => ({
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    width: arrowSize, height: arrowSize, borderRadius: "50%",
    background: disabled ? "rgba(255,255,255,0.5)" : "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: disabled ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: disabled ? "default" : "pointer",
    color: disabled ? "#d1d5db" : "#1f2937",
    zIndex: 10, transition: "all 0.15s",
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div ref={containerRef} style={{
      padding: `${s.spacing_top ?? 40}px 24px ${s.spacing_bottom ?? 40}px`,
      background: s.bg_color || "#fff",
      transition: "all 0.2s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: headerJustify, alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ textAlign: headerAlign, flex: titleAlign === "center" ? 1 : undefined }}>
          {s.title && (
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", lineHeight: 1.3 }}>
              {s.title}
            </div>
          )}
          {s.subtitle && (
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              {s.subtitle}
            </div>
          )}
        </div>
        {s.show_view_all !== false && titleAlign !== "center" && (
          <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, whiteSpace: "nowrap" }}>
            {s.view_all_text || "Tümünü Gör"} →
          </div>
        )}
      </div>

      {/* Source badge */}
      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12, textAlign: headerAlign }}>
        Kaynak: {sourceLabels[source] || source}
        {source === "category" && categoryId && ` (ID: ${categoryId})`}
        {source === "brand" && brandId && ` (ID: ${brandId})`}
        {source === "tag" && tagId && ` (ID: ${tagId})`}
      </div>

      {/* Tabs (for product_tabs) */}
      {showTabs && (
        <div style={{ display: "flex", gap: 16, marginBottom: 16, borderBottom: "2px solid #f3f4f6", paddingBottom: 8 }}>
          {(s.tabs || [{ title: "Yeni" }, { title: "Popüler" }]).slice(0, 4).map((tab: any, i: number) => (
            <div key={i} style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#6366f1" : "#9ca3af", borderBottom: i === 0 ? "2px solid #6366f1" : "none", paddingBottom: 2, cursor: "pointer" }}>
              {tab.title || `Sekme ${i + 1}`}
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
          {Array.from({ length: Math.min(limit, cols) }).map((_, i) => (
            <div key={i} style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
              <div style={{ aspectRatio: "1/1", background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", borderRadius: 16 }} />
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 14, width: "80%", background: "#f1f5f9", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 16, width: "40%", background: "#e0e7ff", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products carousel/grid */}
      {!loading && products.length > 0 && (
        <div style={{ position: "relative" }}>
          {/* Left Arrow */}
          {layoutType === "carousel" && showArrows && canScrollLeft && (
            <button onClick={() => scrollByPage(-1)} style={{ ...arrowBtnStyle(false), left: -12 }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-50%)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}

          {/* Right Arrow */}
          {layoutType === "carousel" && showArrows && canScrollRight && (
            <button onClick={() => scrollByPage(1)} style={{ ...arrowBtnStyle(false), right: -12 }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-50%)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          )}

          {/* Product grid/carousel container */}
          <div
            ref={layoutType === "carousel" ? scrollRef : undefined}
            style={{
              display: "grid",
              gap: 16,
              ...(layoutType === "carousel"
                ? { gridAutoFlow: "column", gridAutoColumns: `calc(${100 / cols}% - ${16 * (cols - 1) / cols}px)`, overflowX: "auto", scrollSnapType: "x mandatory", scrollBehavior: "smooth", overflowY: "hidden" }
                : { gridTemplateColumns: `repeat(${cols}, 1fr)` }),
            }}
            className={layoutType === "carousel" ? `carousel-hide-scrollbar-${carouselId.replace(/:/g, "")}` : undefined}
          >
            {products.slice(0, limit).map((product: any) => {
              const img = getProductImage(product);
              const imgUrl = img ? (img.startsWith("http") ? img : `http://localhost:8000${img.startsWith("/") ? "" : "/storage/"}${img}`) : null;

              const basePrice = Number(product.price || 0);
              const discountPrice = Number(product.special_price || product.discount_price || 0);
              const sellingPrice = Number(product.selling_price || basePrice || 0);
              const hasDiscount = discountPrice > 0 && basePrice > 0 && discountPrice < basePrice;
              const discountPercent = hasDiscount ? Math.round((1 - discountPrice / basePrice) * 100) : 0;

              // Variant thumbnails
              const variants: any[] = product.variants || [];
              const activeVariants = variants.filter((v: any) => v.is_active !== false);
              const thumbVariants = activeVariants.slice(0, 3);
              const showVariantThumbs = !product.list_variants_separately && activeVariants.length > 0;

              const resolveVariantImg = (v: any) => {
                const base = v?.base_image_thumb || v?.base_image;
                if (base) {
                  const p = typeof base === "string" ? base : (base?.url || base?.path);
                  if (p) return p.startsWith("http") ? p : `http://localhost:8000${p.startsWith("/") ? "" : "/storage/"}${p}`;
                }
                const m = v?.media?.[0];
                if (m) {
                  const mp = m.url || m.path;
                  if (mp) return mp.startsWith("http") ? mp : `http://localhost:8000${mp.startsWith("/") ? "" : "/storage/"}${mp}`;
                }
                return null;
              };

              return (
                <div
                  key={product.id}
                  style={{
                    background: "#fff",
                    minWidth: 0,
                    overflow: "hidden",
                    ...(layoutType === "carousel" ? { scrollSnapAlign: "start" } : {}),
                  }}
                >
                  {/* Image area — aspect-square like ProductCard */}
                  <div style={{ position: "relative" }}>
                    {/* Discount badge — round circle like storefront */}
                    {hasDiscount && discountPercent > 0 && (
                      <div style={{
                        position: "absolute", top: 8, left: 8, zIndex: 10,
                        width: 44, height: 44, borderRadius: "50%",
                        background: "#dc2626", color: "#fff",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>-{discountPercent}%</span>
                        <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: 0.5, marginTop: 1 }}>İNDİRİM</span>
                      </div>
                    )}

                    {/* Product image — aspect-square, rounded-2xl */}
                    <div style={{
                      aspectRatio: "1/1", background: "#f9fafb", overflow: "hidden",
                      borderRadius: 16, position: "relative",
                    }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db" }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        </div>
                      )}
                    </div>

                    {/* Variant thumbnails — like storefront */}
                    {showVariantThumbs && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        {thumbVariants.map((v: any, vi: number) => {
                          const vImg = resolveVariantImg(v);
                          return (
                            <div
                              key={v.id || vi}
                              style={{
                                width: 44, height: 44, borderRadius: 12,
                                border: vi === 0 ? "2px solid #0f172a" : "1px solid #e2e8f0",
                                overflow: "hidden", background: "#fff", flexShrink: 0,
                              }}
                            >
                              {vImg ? (
                                <img src={vImg} alt={v.name || product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", background: "#f1f5f9" }} />
                              )}
                            </div>
                          );
                        })}
                        {activeVariants.length > 3 && (
                          <span style={{ fontSize: 12, color: "#6b7280" }}>+{activeVariants.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Product info — matches storefront exactly */}
                  <div style={{ marginTop: 4 }}>
                    <div style={{
                      fontSize: 14, color: "#1f2937", lineHeight: "1.3",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {product.name}
                    </div>
                    <div style={{ marginTop: 4, minHeight: 24, display: "flex", alignItems: "center", gap: 8 }}>
                      {hasDiscount ? (
                        <>
                          <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through", lineHeight: 1 }}>
                            {formatPrice(basePrice)}
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                            {formatPrice(discountPrice)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                          {formatPrice(sellingPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots pagination */}
          {layoutType === "carousel" && showDots && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToPage(i)}
                  style={{
                    width: currentPage === i ? 24 : 8, height: 8,
                    borderRadius: 4, border: "none", cursor: "pointer",
                    background: currentPage === i ? "#6366f1" : "#d1d5db",
                    transition: "all 0.2s ease",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛍️</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {source === "category" && !categoryId ? "Bir kategori seçin" :
             source === "brand" && !brandId ? "Bir marka seçin" :
             source === "tag" && !tagId ? "Bir etiket seçin" :
             source === "manual" && !productIds ? "Ürünleri seçin" :
             "Ürün bulunamadı"}
          </div>
        </div>
      )}

      {/* Styles: pulse animation + hide scrollbar */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .carousel-hide-scrollbar-${carouselId.replace(/:/g, "")} { scrollbar-width: none; -ms-overflow-style: none; }
        .carousel-hide-scrollbar-${carouselId.replace(/:/g, "")}::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ─── GRID (Category / Collection) ───
function GridPreview({ s, title, count, colCount, shape }: { s: Record<string, any>; title: string; count: number; colCount: number; shape: string }) {
  return (
    <div style={{ padding: `${s.spacing_top || 40}px 24px ${s.spacing_bottom || 40}px`, background: s.bg_color || "#fff" }}>
      {title && <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 4, textAlign: s.title_align === "center" ? "center" : "left" }}>{title}</div>}
      {s.subtitle && <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16, textAlign: s.title_align === "center" ? "center" : "left" }}>{s.subtitle}</div>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: 12, marginTop: 12 }}>
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: "100%", aspectRatio: "1/1", background: "#e2e8f0", borderRadius: shape === "round" ? "50%" : 12, border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20, color: "#94a3b8" }}>📷</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textAlign: "center" }}>Kategori {i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COLLECTION GRID ───
function CollectionGridPreview({ s }: { s: Record<string, any> }) {
  const collections = s.collections || [];
  const cols = Number(s.columns) || 3;
  const hasItems = collections.length > 0;
  const showOverlay = s.show_overlay !== false;

  return (
    <div style={{ padding: `${s.spacing_top || 40}px 24px ${s.spacing_bottom || 40}px`, background: s.bg_color || "#fff" }}>
      {s.title && <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 4, textAlign: s.title_align === "center" ? "center" : "left" }}>{s.title}</div>}
      {s.subtitle && <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16, textAlign: s.title_align === "center" ? "center" : "left" }}>{s.subtitle}</div>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginTop: 12 }}>
        {hasItems ? collections.map((item: any, i: number) => (
          <div key={i} style={{ position: "relative", aspectRatio: "4/5", borderRadius: 12, overflow: "hidden", background: "#f1f5f9" }}>
            {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            {showOverlay && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />}
            {item.button_text && (
              <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                <span style={{ background: "rgba(255,255,255,0.9)", color: "#111", padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{item.button_text}</span>
              </div>
            )}
          </div>
        )) : Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ aspectRatio: "4/5", background: "#f8fafc", borderRadius: 12, border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Koleksiyon {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MULTI IMAGE GRID ───
function MultiImageGridPreview({ s }: { s: Record<string, any> }) {
  const items = s.items || [];
  const cols = Number(s.columns) || 4;
  const hasItems = items.length > 0;

  return (
    <div style={{ padding: `${s.spacing_top || 40}px 24px ${s.spacing_bottom || 40}px`, background: s.bg_color || "#fff" }}>
      {s.title && <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 4, textAlign: s.title_align === "center" ? "center" : "left" }}>{s.title}</div>}
      {s.subtitle && <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16, textAlign: s.title_align === "center" ? "center" : "left" }}>{s.subtitle}</div>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginTop: 12 }}>
        {hasItems ? items.map((item: any, i: number) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 12, overflow: "hidden", background: "#f3f4f6", border: "1px solid #f3f4f6" }}>
              {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 24 }}>📷</div>
              )}
            </div>
            {item.title && <div style={{ height: 12, fontSize: 10, fontWeight: 600, color: "#374151", textAlign: "center" }}>{item.title}</div>}
          </div>
        )) : Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: "100%", aspectRatio: "1/1", background: "#f8fafc", borderRadius: 12, border: "1px dashed #d1d5db" }} />
            <div style={{ height: 10, width: 60, background: "#f1f5f9", borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FULL BANNER ───
function FullBannerPreview({ s }: { s: Record<string, any> }) {
  const layout = s.layout_type || "overlay";
  const hasImage = !!s.image;
  const opacity = (s.overlay_opacity ?? 30) / 100;

  if (layout === "split") {
    return (
      <div style={{ display: "flex", minHeight: 200, margin: `${s.spacing_top || 0}px 0 ${s.spacing_bottom || 0}px`, background: s.bg_color || "#6366f1", borderRadius: s.border_radius === "lg" ? 24 : s.border_radius === "md" ? 12 : 0, overflow: "hidden" }}>
        <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", color: s.text_color || "#fff" }}>
          {s.title && <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{s.title}</div>}
          {s.subtitle && <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>{s.subtitle}</div>}
          {s.button_text && <div style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, width: "fit-content" }}>{s.button_text}</div>}
        </div>
        <div style={{ flex: 1, background: hasImage ? undefined : "#e2e8f0", position: "relative" }}>
          {hasImage && <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: 200, margin: `${s.spacing_top || 0}px 0 ${s.spacing_bottom || 0}px`, background: hasImage ? undefined : (s.bg_color || "#e2e8f0"), borderRadius: s.border_radius === "lg" ? 24 : s.border_radius === "md" ? 12 : 0, overflow: "hidden" }}>
      {hasImage && <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />}
      {layout === "overlay" && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${opacity})` }} />}
      {layout === "overlay" && (
        <div style={{ position: "relative", padding: 32, color: s.text_color || "#fff", textAlign: s.text_position === "center" ? "center" : s.text_position === "right" ? "right" : "left" }}>
          {s.title && <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{s.title}</div>}
          {s.subtitle && <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>{s.subtitle}</div>}
          {s.button_text && <div style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, width: "fit-content", display: "inline-block" }}>{s.button_text}</div>}
        </div>
      )}
    </div>
  );
}

// ─── BANNER GRID ───
function BannerGridPreview({ s }: { s: Record<string, any> }) {
  const banners = s.banners || [];
  const count = Math.max(banners.length, 2);
  return (
    <div style={{ padding: `${s.spacing_top || 24}px 24px ${s.spacing_bottom || 24}px` }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(2, 1fr)`, gap: s.gap || 12 }}>
        {Array.from({ length: count }).map((_, i) => {
          const b = banners[i] || {};
          return (
            <div key={i} style={{ position: "relative", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
              {b.image && <img src={b.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, background: "linear-gradient(transparent, rgba(0,0,0,0.5))", color: "#fff" }}>
                {b.title && <div style={{ fontSize: 14, fontWeight: 700 }}>{b.title}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COUNTDOWN ───
function CountdownPreview({ s }: { s: Record<string, any> }) {
  return (
    <div style={{ padding: `${s.spacing_top || 24}px 24px ${s.spacing_bottom || 24}px` }}>
      <div style={{ background: `linear-gradient(135deg, ${s.bg_gradient_from || "#6366f1"}, ${s.bg_gradient_to || "#f97316"})`, borderRadius: 16, padding: "32px 24px", textAlign: "center", color: s.text_color || "#fff" }}>
        {s.title && <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{s.title}</div>}
        {s.subtitle && <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>{s.subtitle}</div>}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          {["GÜN", "SAAT", "DAK", "SN"].map((l) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", minWidth: 48 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>00</div>
              <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {s.button_text && <div style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "inline-block" }}>{s.button_text}</div>}
      </div>
    </div>
  );
}

// ─── INFO CARDS ───
function InfoCardsPreview({ s }: { s: Record<string, any> }) {
  const cards = s.cards || [];
  const cols = Number(s.columns) || 4;
  return (
    <div style={{ padding: `${s.spacing_top || 24}px 24px ${s.spacing_bottom || 24}px`, background: s.bg_color || "#f8fafc" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
        {(cards.length > 0 ? cards : [{ title: "Ücretsiz Kargo" }, { title: "Kolay İade" }, { title: "Güvenli Ödeme" }, { title: "Taksit" }]).map((c: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0e7ff", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>{c.title}</div>
              {c.description && <div style={{ fontSize: 10, color: "#9ca3af" }}>{c.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BRAND LOGOS ───
function BrandLogosPreview({ s }: { s: Record<string, any> }) {
  const count = Math.min(Number(s.limit) || 6, 8);
  return (
    <div style={{ padding: `${s.spacing_top || 24}px 24px ${s.spacing_bottom || 24}px` }}>
      {s.title && <div style={{ fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 16, color: "#1f2937" }}>{s.title}</div>}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ width: 80, height: 36, background: "#f8fafc", borderRadius: 6, border: "1px solid #f3f4f6", filter: s.grayscale ? "grayscale(1)" : "none" }} />
        ))}
      </div>
    </div>
  );
}

// ─── TESTIMONIALS ───
function TestimonialsPreview({ s }: { s: Record<string, any> }) {
  const reviews = s.reviews || [];
  return (
    <div style={{ padding: `${s.spacing_top || 40}px 24px ${s.spacing_bottom || 40}px` }}>
      {s.title && <div style={{ fontSize: 18, fontWeight: 700, textAlign: s.title_align === "center" ? "center" : "left", marginBottom: 16, color: "#1f2937" }}>{s.title}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {(reviews.length > 0 ? reviews.slice(0, 3) : [1, 2, 3]).map((_: any, i: number) => {
          const r = reviews[i] || {};
          return (
            <div key={i} style={{ padding: 16, borderRadius: 12, border: "1px solid #f3f4f6", background: "#fafafa" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} style={{ width: 12, height: 12, borderRadius: 2, background: j < (r.rating || 5) ? "#f59e0b" : "#e5e7eb" }} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 8, minHeight: 36 }}>{r.text || "Harika bir deneyimdi..."}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{r.name || `Müşteri ${i + 1}`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NEWSLETTER ───
function NewsletterPreview({ s }: { s: Record<string, any> }) {
  return (
    <div style={{ padding: `${s.spacing_top || 40}px 24px ${s.spacing_bottom || 40}px`, background: s.bg_color || "#f8fafc", textAlign: "center" }}>
      {s.title && <div style={{ fontSize: 20, fontWeight: 700, color: s.text_color || "#1f2937", marginBottom: 4 }}>{s.title}</div>}
      {s.subtitle && <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>{s.subtitle}</div>}
      <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }}>
        <div style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", padding: "0 12px", fontSize: 12, color: "#9ca3af" }}>
          {s.placeholder || "E-posta adresiniz"}
        </div>
        <div style={{ background: "#6366f1", color: "#fff", padding: "0 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center" }}>
          {s.button_text || "Abone Ol"}
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ───
function FaqPreview({ s }: { s: Record<string, any> }) {
  const questions = s.questions || [];
  return (
    <div style={{ padding: `${s.spacing_top || 40}px 24px ${s.spacing_bottom || 40}px` }}>
      {s.title && <div style={{ fontSize: 18, fontWeight: 700, textAlign: s.title_align === "center" ? "center" : "left", marginBottom: 16, color: "#1f2937" }}>{s.title}</div>}
      <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {(questions.length > 0 ? questions.slice(0, 4) : [{ question: "Soru 1?" }, { question: "Soru 2?" }, { question: "Soru 3?" }]).map((q: any, i: number) => (
          <div key={i} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #f3f4f6", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{q.question || `Soru ${i + 1}?`}</span>
            <span style={{ color: "#9ca3af", fontSize: 16 }}>+</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RICH TEXT ───
function RichTextPreview({ s }: { s: Record<string, any> }) {
  const maxWidthMap: Record<string, number> = { sm: 480, md: 600, lg: 760, full: 9999 };
  return (
    <div style={{ padding: `${s.spacing_top || 24}px 24px ${s.spacing_bottom || 24}px`, textAlign: s.text_align === "center" ? "center" : "left" }}>
      <div style={{ maxWidth: maxWidthMap[s.max_width] || 600, margin: "0 auto" }}>
        {s.content ? (
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: s.content }} />
        ) : (
          <div style={{ padding: 24, border: "2px dashed #e5e7eb", borderRadius: 8, color: "#9ca3af", fontSize: 13 }}>
            Zengin metin içeriği buraya gelecek...
          </div>
        )}
      </div>
    </div>
  );
}
