"use client";

import React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { VideoPlayer } from "./VideoPlayer";
import { Play, ZoomIn, X } from "lucide-react";

interface MediaItem {
  id?: number;
  type?: string;
  path?: string;
  url?: string;
  thumb_path?: string | null;
  thumb_url?: string | null;
  mime?: string | null;
  alt?: string | null;
}

import { getImageUrl } from "@/lib/media/getImageUrl";

export default function ProductImageCarousel({
  media = [],
  alt,
  showArrows = true,
  showZoom = true,
}: {
  media?: (string | MediaItem)[]; // Make optional to prevent type errors
  alt: string;
  showArrows?: boolean;
  showZoom?: boolean;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isZoomed, setIsZoomed] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Normalize media items
  const normalizedMedia = React.useMemo(() => {
    if (!media || !Array.isArray(media)) return []; // Defensive check

    return media.map((item, idx) => {
      if (typeof item === "string") {
        return {
          id: idx,
          type: "image",
          url: getImageUrl(item),
          path: item,
          thumb_url: getImageUrl(item),
          thumb_path: item,
          mime: null,
          alt: null,
        };
      }
      return {
        id: item.id ?? idx,
        type: item.type || "image",
        url: getImageUrl(item.url || item.path),
        path: item.path || item.url || "",
        thumb_url: getImageUrl(item.thumb_url || item.thumb_path),
        thumb_path: item.thumb_path,
        mime: item.mime,
        alt: item.alt,
      };
    });
  }, [media]);

  const currentMedia = normalizedMedia[selectedIndex];
  const isVideo = currentMedia?.type === "video" || currentMedia?.mime?.startsWith("video/");

  const showDots = normalizedMedia.length > 1;
  const canScrollPrev = Boolean(emblaApi?.canScrollPrev());
  const canScrollNext = Boolean(emblaApi?.canScrollNext());

  return (
    <>
      <div className="relative aspect-square bg-gray-50 overflow-hidden rounded-2xl lg:rounded-lg">
        <div ref={emblaRef} className="overflow-hidden h-full">
          <div className="flex h-full">
            {normalizedMedia.map((item, i) => {
              const itemIsVideo = item.type === "video" || item.mime?.startsWith("video/");

              return (
                <div key={item.id} className="relative flex-[0_0_100%] min-w-0 h-full">
                  {itemIsVideo ? (
                    <VideoPlayer
                      url={item.url}
                      thumbnail={item.thumb_url || item.thumb_path}
                      className="w-full h-full"
                    />
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.alt || alt}
                      fill
                      className="object-cover"
                      priority={i === 0} // Fix LCP warning for first image
                      quality={90} // Improve image quality
                      sizes="(max-width: 768px) 100vw, 50vw" // Increase sizes for better resolution
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zoom Button - Only for images */}
        {showZoom && !isVideo && (
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Yakınlaştır"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {showArrows && normalizedMedia.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Önceki"
              disabled={!canScrollPrev}
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800 disabled:opacity-40 z-10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Sonraki"
              disabled={!canScrollNext}
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800 disabled:opacity-40 z-10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}

        {showDots ? (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-10 pointer-events-none">
            {normalizedMedia.map((item, i) => {
              const isActive = i === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`${item.type === 'video' ? 'Video' : 'Görsel'} ${i + 1}`}
                  className={`
                    rounded-full transition-all duration-300 shadow-sm pointer-events-auto
                    ${isActive
                      ? "w-8 h-1.5 bg-black/70"
                      : "w-1.5 h-1.5 bg-white/60 hover:bg-white/90"
                    }
                  `}
                  onClick={() => emblaApi?.scrollTo(i)}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Lightbox/Zoom Modal - Only for images */}
      {showZoom && isZoomed && !isVideo && currentMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-7xl max-h-full">
            <Image
              src={currentMedia.url}
              alt={currentMedia.alt || alt}
              width={1920}
              height={1920}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
