"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ProductExtraOptionsProps {
  options: any[];
  selectedExtraOptions: Record<number, number>;
  onSelect: (optionId: number, valueId: number) => void;
}

export function ProductExtraOptions({ options, selectedExtraOptions, onSelect }: ProductExtraOptionsProps) {
  if (!Array.isArray(options) || options.length === 0) return null;

  return (
    <>
      {options.map((option: any) => (
        <div key={option.id}>
          <div className="mb-3 font-semibold text-gray-900">
            {option.name}:{" "}
            <span className="font-normal text-gray-600">
              {option.values.find((v: any) => v.id === selectedExtraOptions[option.id])?.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {option.values.map((val: any) => {
              const isSelected = selectedExtraOptions[option.id] === val.id;
              return (
                <button
                  key={val.id}
                  onClick={() => onSelect(option.id, val.id)}
                  className={cn(
                    "h-10 px-4 rounded-lg border-2 text-sm font-medium transition-all",
                    isSelected ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {val.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

