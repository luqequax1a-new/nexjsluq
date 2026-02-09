"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function AuthLoadingOverlay({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-xl"
      >
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        <span>{message}</span>
      </div>
    </div>
  );
}
