"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import ProductCard from "@/components/storefront/product/ProductCard";
import type { ProductLike } from "@/components/storefront/product/ProductCard";
import type { Unit } from "@/hooks/useUnit";

interface ProductCarouselProps {
  products: ProductLike[];
  units: Unit[];
  columns?: number;
  rows?: number;
  layoutType?: "carousel" | "grid";
  showArrows?: boolean;
  showDots?: boolean;
}

// ─── Shared arrow SVGs ───
const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const arrowBase = "absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:shadow-lg hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100";

// ─── Mouse drag hook for scroll containers ───
function useMouseDrag(ref: React.RefObject<HTMLDivElement | null>) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.pageX;
      scrollStart.current = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.scrollSnapType = "none";
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      el.scrollLeft = scrollStart.current - (e.pageX - startX.current);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      el.style.cursor = "";
      el.style.scrollSnapType = "x mandatory";
      // Snap to nearest page
      const pageW = el.clientWidth;
      if (pageW > 0) {
        const nearest = Math.round(el.scrollLeft / pageW) * pageW;
        el.scrollTo({ left: nearest, behavior: "smooth" });
      }
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [ref]);
}

export default function ProductCarousel({
  products,
  units,
  columns = 4,
  rows = 1,
  layoutType = "carousel",
  showArrows = true,
  showDots = false,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const isCarousel = layoutType === "carousel";
  const effectiveRows = Math.max(1, rows);
  const itemsPerPage = columns * effectiveRows;
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const hasMultiplePages = totalPages > 1;

  // Mouse drag support
  useMouseDrag(scrollRef);

  // Chunk products into pages for multi-row
  const pages = useMemo(() => {
    if (!isCarousel) return null;
    const result: ProductLike[][] = [];
    for (let i = 0; i < products.length; i += itemsPerPage) {
      result.push(products.slice(i, i + itemsPerPage));
    }
    return result;
  }, [products, itemsPerPage, isCarousel]);

  // Track scroll position for arrows & dots
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    const page = Math.round(el.scrollLeft / el.clientWidth);
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isCarousel) return;
    const raf = requestAnimationFrame(updateScrollState);
    const t1 = setTimeout(updateScrollState, 300);
    const t2 = setTimeout(updateScrollState, 800);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [isCarousel, updateScrollState, products]);

  const goToPage = (page: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * page, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  const colClass =
    columns === 3 ? "md:grid-cols-3" : columns === 5 ? "md:grid-cols-5" : columns === 6 ? "md:grid-cols-6" : "md:grid-cols-4";

  // ─── Pure grid mode (no scrolling) ───
  if (!isCarousel) {
    return (
      <div className={`grid grid-cols-2 ${colClass} gap-4 md:gap-6`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} units={units} />
        ))}
      </div>
    );
  }

  // ─── Carousel mode (both single-row and multi-row use same paged approach) ───
  if (!pages || pages.length === 0) return null;

  return (
    <div className="relative group/carousel">
      {/* Arrows */}
      {showArrows && hasMultiplePages && currentPage > 0 && (
        <button onClick={() => goToPage(currentPage - 1)} className={`${arrowBase} left-0 -translate-x-3`} aria-label="Önceki">
          <ArrowLeft />
        </button>
      )}
      {showArrows && hasMultiplePages && currentPage < totalPages - 1 && (
        <button onClick={() => goToPage(currentPage + 1)} className={`${arrowBase} right-0 translate-x-3`} aria-label="Sonraki">
          <ArrowRight />
        </button>
      )}

      {/* Scrollable pages container */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: hasMultiplePages ? "grab" : undefined,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style>{`
          [data-product-carousel]::-webkit-scrollbar { display: none; }
        `}</style>
        {pages.map((pageProducts, pi) => (
          <div
            key={pi}
            data-product-carousel
            className={`grid grid-cols-2 ${colClass} gap-4 md:gap-6`}
            style={{
              minWidth: "100%",
              width: "100%",
              flexShrink: 0,
              scrollSnapAlign: "start",
            }}
          >
            {pageProducts.map((p) => (
              <ProductCard key={p.id} product={p} units={units} />
            ))}
          </div>
        ))}
      </div>

      {/* Dots */}
      {hasMultiplePages && (
        <div className="flex justify-center gap-1.5 mt-5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`h-2 rounded-full transition-all ${
                currentPage === i ? "w-6 bg-gray-900" : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Sayfa ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export type { ProductCarouselProps };
