"use client";

import React from "react";

interface PageLoaderProps {
  fullScreen?: boolean;
  size?: number;
}

export function PageLoader({ fullScreen = true, size = 36 }: PageLoaderProps) {
  return (
    <div className={`ikas-loader-container ${fullScreen ? 'full-screen' : 'local'}`}>
      {/* Top progress bar */}
      {fullScreen && (
        <div className="ikas-progress-bar" />
      )}

      <div className="ikas-loader-logo" style={{ width: size, height: size }}>
        <div className="bracket left" style={{ width: size * 0.4, height: size * 0.8, borderWidth: Math.max(2, size * 0.08) }}></div>
        <div className="bracket right" style={{ width: size * 0.4, height: size * 0.8, borderWidth: Math.max(2, size * 0.08) }}></div>
      </div>

      <style jsx>{`
        .ikas-loader-container {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(1px);
          transition: opacity 0.15s ease-in-out;
        }
        .ikas-loader-container.full-screen {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
        }
        .ikas-loader-container.local {
          padding: 20px;
          width: 100%;
          min-height: 100px;
        }

        .ikas-progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #6366f1, transparent);
          animation: ikas-bar-slide 1.2s ease-in-out infinite;
          border-radius: 2px;
        }

        .ikas-loader-logo {
          position: relative;
          animation: ikas-pulse 1.5s ease-in-out infinite;
        }

        .bracket {
          position: absolute;
          border-style: solid;
          border-color: #6366f1;
        }

        .bracket.left {
          left: 0;
          top: 10%;
          border-right: none;
          border-radius: 8px 0 0 8px;
        }

        .bracket.right {
          right: 0;
          top: 10%;
          border-left: none;
          border-radius: 0 8px 8px 0;
        }

        @keyframes ikas-pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }

        @keyframes ikas-bar-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
