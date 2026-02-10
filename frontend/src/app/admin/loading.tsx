"use client";

export default function Loading() {
    return (
        <div style={{ position: "relative", width: "100%", minHeight: 200 }}>
            {/* Top progress bar */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, transparent, #6366f1, transparent)",
                animation: "admin-loading-bar 1.2s ease-in-out infinite",
                borderRadius: 2,
                zIndex: 10,
            }} />
            <style>{`
                @keyframes admin-loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
