"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";
import type { OrderStatus } from "@/types/order";

const STEPS: Array<{
  key: Exclude<OrderStatus, "cancelled" | "refunded">;
  labelKey: string;
  fallback: string;
}> = [
  { key: "pending", labelKey: "storefront.order_tracking.status.pending", fallback: "Beklemede" },
  { key: "confirmed", labelKey: "storefront.order_tracking.status.confirmed", fallback: "Onaylandi" },
  { key: "processing", labelKey: "storefront.order_tracking.status.processing", fallback: "Hazirlaniyor" },
  { key: "shipped", labelKey: "storefront.order_tracking.status.shipped", fallback: "Kargoda" },
  { key: "delivered", labelKey: "storefront.order_tracking.status.delivered", fallback: "Teslim edildi" },
];

export default function TrackingProgress({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const currentStepIndex = STEPS.findIndex((step) => step.key === status);
  const isCancelled = status === "cancelled";
  const isRefunded = status === "refunded";

  if (isCancelled || isRefunded) {
    const text = isCancelled
      ? t("storefront.order_tracking.status.cancelled", "Siparis iptal edildi.")
      : t("storefront.order_tracking.status.refunded", "Siparis iade edildi.");

    return (
      <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
        {text}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <ol className="flex min-w-[620px] items-start">
        {STEPS.map((step, index) => {
          const isDone = currentStepIndex >= index;
          const isCurrent = currentStepIndex === index;
          const connectorDone = currentStepIndex > index;

          return (
            <li key={step.key} className="flex flex-1 items-start">
              <div className="flex flex-col items-center text-center">
                <span
                  className={
                    "inline-flex h-7 w-7 items-center justify-center border text-[11px] font-bold " +
                    (isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-slate-500")
                  }
                >
                  {index + 1}
                </span>
                <span
                  className={
                    "mt-2 max-w-[112px] text-[11px] font-semibold leading-4 " +
                    (isCurrent ? "text-emerald-700" : isDone ? "text-slate-800" : "text-slate-500")
                  }
                >
                  {t(step.labelKey, step.fallback)}
                </span>
              </div>

              {index < STEPS.length - 1 ? (
                <span className="mt-3 block h-[2px] flex-1 px-2">
                  <span className={"block h-full " + (connectorDone ? "bg-emerald-500" : "bg-slate-200")} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
