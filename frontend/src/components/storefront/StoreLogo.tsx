"use client";

import React from "react";
import Image from "next/image";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path.replace("http://127.0.0.1:8000", "http://localhost:8000");
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/${path}`;
}

export default function StoreLogo({
  size = 40,
  width,
  height,
  fallbackText = "F",
  roundedClassName = "rounded-lg",
  className = "",
}: {
  size?: number;
  width?: number;
  height?: number;
  fallbackText?: string;
  roundedClassName?: string;
  className?: string;
}) {
  const { settings } = useStorefrontSettings();
  const src = getImageUrl(settings.logo);
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  const computedFallback = (() => {
    const ft = (fallbackText || "").trim();
    if (ft) return ft;
    const name = String(settings.store_name || "").trim();
    if (!name) return "";
    return name.slice(0, 1).toUpperCase();
  })();

  if (src) {
    return (
      <div
        className={`${roundedClassName} bg-white overflow-hidden ${className}`.trim()}
        style={{ width: finalWidth, height: finalHeight, position: "relative" }}
      >
        <Image
          src={src}
          alt={settings.store_name || "Store Logo"}
          fill
          sizes={`${finalWidth}px`}
          className="object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
        />
      </div>
    );
  }

  if (!computedFallback) {
    return (
      <div
        className={`bg-gray-100 border border-gray-200 flex items-center justify-center ${roundedClassName} ${className}`.trim()}
        style={{ width: finalWidth, height: finalHeight }}
      />
    );
  }

  return (
    <div
      className={`bg-primary text-white flex items-center justify-center font-bold font-heading ${roundedClassName} ${className}`.trim()}
      style={{ width: finalWidth, height: finalHeight, fontSize: Math.max(14, Math.floor(Math.min(finalWidth, finalHeight) / 2)) }}
    >
      {computedFallback}
    </div>
  );
}
