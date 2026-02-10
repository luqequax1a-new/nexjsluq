"use client";

import React, { useState, useEffect } from "react";

interface MarqueeBannerProps {
  settings: Record<string, any>;
}

export default function MarqueeBanner({ settings }: MarqueeBannerProps) {
  const items: { text?: string }[] = settings.items || [];
  const messages = items.filter((i) => i.text?.trim());

  const bgColor = settings.bg_color || "#ee8bb9";
  const textColor = settings.text_color || "#fff";
  const fontSize = settings.font_size || 13;
  const height = settings.height || 41;
  const autoplaySpeed = (settings.autoplay_speed || 4) * 1000;

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, autoplaySpeed);
    return () => clearInterval(timer);
  }, [messages.length, autoplaySpeed]);

  if (messages.length === 0) return null;

  return (
    <div className="overflow-hidden relative" style={{ background: bgColor, height }}>
      <div
        className="flex h-full"
        style={{
          width: `${messages.length * 100}%`,
          transform: `translate3d(-${activeIndex * (100 / messages.length)}%, 0, 0)`,
          transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {messages.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center shrink-0"
            style={{ width: `${100 / messages.length}%`, height: "100%" }}
          >
            <div
              className="w-3/4 mx-auto text-center font-bold truncate"
              style={{ color: textColor, fontSize, lineHeight: 1.3 }}
            >
              {item.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
