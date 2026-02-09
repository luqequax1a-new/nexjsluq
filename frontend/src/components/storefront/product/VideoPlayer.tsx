"use client";

import React, { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface VideoPlayerProps {
    url: string;
    thumbnail?: string | null;
    className?: string;
}

export function VideoPlayer({ url, thumbnail, className = "" }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [paused, setPaused] = useState(true);

    const togglePlay = (e?: React.MouseEvent) => {
        // Prevent event from bubbling if needed, though we are on an overlay
        e?.preventDefault();
        e?.stopPropagation();

        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(() => {
                    // Auto-play might be blocked
                });
            } else {
                videoRef.current.pause();
            }
        }
    };

    // If thumbnail is a video file itself (fallback from backend), don't use it as poster image
    // The video element will use the first frame as native poster in this case
    const isVideoThumbnail = thumbnail && /\.(mp4|webm|ogg|mov|mkv|avi|flv)(\?.*)?$/i.test(thumbnail);
    const poster = isVideoThumbnail ? undefined : (thumbnail || undefined);

    return (
        <div className={`relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden ${className} group`}>
            {/* Background Blur Effect for vertical/fit videos */}
            {poster && (
                <div
                    className="absolute inset-0 bg-center bg-cover scale-110 blur-xl opacity-40 grayscale-[20%]"
                    style={{ backgroundImage: `url(${poster})` }}
                />
            )}

            {/* Click Overlay (Excluding bottom controls area) 
                z-20 ensures it's above the video but we leave bottom-12 space for native controls
            */}
            <div
                className="absolute inset-x-0 top-0 bottom-14 z-20 cursor-pointer flex items-center justify-center"
                onClick={togglePlay}
            >
                {/* Play/Pause Icon Indicator */}
                <div className={`
                    w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white 
                    transition-all duration-300 transform
                    ${paused ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-100"}
                `}>
                    {paused ? (
                        <Play className="w-8 h-8 ml-1 fill-white" />
                    ) : (
                        <Pause className="w-8 h-8 fill-white" />
                    )}
                </div>
            </div>

            <video
                ref={videoRef}
                src={url}
                poster={poster}
                className="relative z-10 w-full h-full object-contain"
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
            >
                <source src={url} type="video/mp4" />
                Tarayıcınız video etiketini desteklemiyor.
            </video>
        </div>
    );
}
