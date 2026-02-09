"use client";

import React, { useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Öne çıkanlar" },
  { value: "newest", label: "Son eklenen" },
  { value: "price_asc", label: "Fiyat artan" },
  { value: "price_desc", label: "Fiyat azalan" },
];

export default function SortModal({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onChange: (v: string) => void;
}) {
  const selected = useMemo(() => value, [value]);

  return (
    <div className={cn("fixed inset-0 z-[200] lg:hidden", open ? "visible" : "invisible pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "absolute left-1/2 top-1/2 w-[92vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl overflow-hidden transition-transform",
          open ? "scale-100" : "scale-95"
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="text-lg font-extrabold">Sırala</div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                onClose();
              }}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between text-left border-b last:border-b-0",
                selected === opt.value ? "bg-primary/5" : "bg-white"
              )}
            >
              <span className="text-[14px] text-gray-800">{opt.label}</span>
              <span
                className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center",
                  selected === opt.value ? "border-primary" : "border-gray-300"
                )}
              >
                {selected === opt.value ? <span className="w-2.5 h-2.5 rounded-full bg-primary" /> : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
