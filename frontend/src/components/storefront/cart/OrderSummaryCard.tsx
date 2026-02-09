"use client";

import React from "react";
import { cn } from "@/lib/utils";

type SummaryRow = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

type OrderSummaryCardProps = {
  title?: string;
  subtitle?: string;
  itemCount?: number;
  itemsTitle?: string;
  itemsContent?: React.ReactNode;
  rows: SummaryRow[];
  totalLabel?: React.ReactNode;
  totalValue: React.ReactNode;
  totalValueClassName?: string;
  totalLabelClassName?: string;
  totalAccentColor?: string;
  couponSection?: React.ReactNode;
  note?: React.ReactNode;
  actions?: React.ReactNode;
};

export function OrderSummaryCard({
  title = "Özet",
  subtitle,
  itemCount,
  itemsTitle = "Ürünler",
  itemsContent,
  rows,
  totalLabel = "Toplam",
  totalValue,
  totalValueClassName,
  totalLabelClassName,
  totalAccentColor = "#6366f1",
  couponSection,
  note,
  actions,
}: OrderSummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div>
          <div className="text-[16px] font-extrabold text-slate-900">{title}</div>
          {subtitle ? <div className="text-[12px] text-slate-500">{subtitle}</div> : null}
        </div>
        {typeof itemCount === "number" ? (
          <div className="text-[12px] text-slate-500 font-medium">{itemCount} ürün</div>
        ) : null}
      </div>

      <div className="p-6 space-y-5">
        {itemsContent ? (
          <div>
            <div className="hidden lg:block">
              <div className="text-[13px] font-semibold text-slate-900 mb-2">{itemsTitle}</div>
              <div className="space-y-2">{itemsContent}</div>
            </div>
            <div className="lg:hidden">
              <details className="group -mx-6 border-t border-slate-200">
                <summary className="list-none flex items-center justify-between cursor-pointer px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-900">{itemsTitle}</span>
                    {typeof itemCount === "number" ? (
                      <span className="text-[12px] font-semibold text-slate-500">({itemCount})</span>
                    ) : null}
                  </div>
                  <span aria-hidden className="text-slate-500">
                    <svg
                      className="h-4 w-4 transition-transform group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-4 space-y-3">{itemsContent}</div>
              </details>
            </div>
          </div>
        ) : null}

        {couponSection ? <div>{couponSection}</div> : null}

        <div className="space-y-3 text-[14px]">
          {rows.map((row, index) => (
            <div
              key={index}
              className={cn("grid grid-cols-[1fr_auto] items-center gap-4", row.className)}
            >
              <span className={cn("text-slate-600", row.labelClassName)}>{row.label}</span>
              <span className={cn("tabular-nums text-right min-w-[96px]", row.valueClassName)}>{row.value}</span>
            </div>
          ))}

          <div className="h-px bg-slate-200" />

          <div className="grid grid-cols-[1fr_auto] items-baseline gap-4">
            <span className={cn("text-[18px] font-extrabold text-slate-900", totalLabelClassName)}>
              {totalLabel}
            </span>
            <span
              className={cn("text-[20px] font-extrabold tabular-nums text-right min-w-[120px]", totalValueClassName)}
              style={{ color: totalAccentColor }}
            >
              {totalValue}
            </span>
          </div>
        </div>

        {note ? (
          <div className="text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            {note}
          </div>
        ) : null}

        {actions ? <div className="space-y-3">{actions}</div> : null}
      </div>
    </div>
  );
}
