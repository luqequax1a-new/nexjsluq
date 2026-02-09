"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";

export default function AnnouncementBar({ hidden }: { hidden: boolean }) {
  const { settings } = useStorefrontSettings();

  const text = settings?.announcement_text || "3000 TL ÜZERİ KARGO BEDAVA";
  const bgColor = settings?.announcement_bg_color || "#ff00a8";
  const textColor = settings?.announcement_text_color || "#ffffff";
  const fontSize = settings?.announcement_font_size ? `${settings.announcement_font_size}px` : "12px";
  const speed = settings?.announcement_speed ? `${settings.announcement_speed}s` : "10s";
  const isMarquee = settings?.announcement_marquee === "true" || settings?.announcement_marquee === "1";
  
  // Font family handling (basic implementation)
  const fontFamily = settings?.announcement_font_family || "inherit";

  return (
    <div
      className={cn(
        "text-center font-extrabold tracking-wide uppercase overflow-hidden flex items-center justify-center font-heading transition-all duration-300 ease-in-out relative",
        hidden ? "h-0 opacity-0" : "h-10 opacity-100"
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontSize: fontSize,
        fontFamily: fontFamily,
      }}
    >
      {isMarquee ? (
        <div className="w-full overflow-hidden flex items-center">
             <div 
               className="whitespace-nowrap flex items-center gap-10 animate-marquee"
               style={{ animationDuration: speed }}
             >
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
             </div>
             {/* Duplicate for seamless loop if needed, though simple duplicate text spans often work for CSS marquee if width is enough */}
             <div 
               className="whitespace-nowrap flex items-center gap-10 animate-marquee ml-10"
               style={{ animationDuration: speed }}
               aria-hidden="true"
             >
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
               <span>{text}</span>
             </div>
             
             <style>{`
               @keyframes marquee {
                 0% { transform: translateX(0); }
                 100% { transform: translateX(-100%); }
               }
               .animate-marquee {
                 animation: marquee linear infinite;
               }
             `}</style>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-10 whitespace-nowrap px-4 container mx-auto">
          <span>{text}</span>
        </div>
      )}
    </div>
  );
}
