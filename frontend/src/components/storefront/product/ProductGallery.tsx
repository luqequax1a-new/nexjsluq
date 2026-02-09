"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Media } from "@/types/storefront";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/media/getImageUrl";

interface ProductGalleryProps {
    media: Media[];
}

export function ProductGallery({ media }: ProductGalleryProps) {
    const [selectedId, setSelectedId] = useState<number | null>(() => media?.[0]?.id ?? null);
    const activeImage = media.find((m) => m.id === selectedId) ?? media?.[0] ?? null;
    const objectPosition = activeImage?.focal_x != null && activeImage?.focal_y != null
        ? `${Number(activeImage.focal_x) * 100}% ${Number(activeImage.focal_y) * 100}%`
        : "50% 50%";

    if (!media || media.length === 0) {
        return (
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
                <Image
                    src={getImageUrl(null)}
                    alt="Product placeholder"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                {media.map((item, idx) => (
                    <button
                        key={item?.id ?? idx}
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                            "relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                            activeImage?.id === item.id
                                ? "border-primary"
                                : "border-transparent hover:border-gray-200"
                        )}
                    >
                        <Image
                            src={getImageUrl(item.thumb_url || item.thumb_path || item.url || item.path)}
                            alt="Product thumbnail"
                            fill
                            className="object-cover"
                            style={{
                                objectPosition: item?.focal_x != null && item?.focal_y != null
                                    ? `${Number(item.focal_x) * 100}% ${Number(item.focal_y) * 100}%`
                                    : "50% 50%"
                            }}
                            sizes="80px"
                        />
                    </button>
                ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 aspect-square md:aspect-[4/5] relative rounded-2xl overflow-hidden bg-gray-50 border">
                {activeImage && (
                    <Image
                        src={getImageUrl(activeImage.url || activeImage.path)}
                        alt="Product active"
                        fill
                        className="object-cover"
                        style={{ objectPosition }}
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                )}
            </div>
        </div>
    );
}
