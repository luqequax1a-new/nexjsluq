"use client";

import React from "react";
import { Product } from "@/types/storefront";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/media/getImageUrl";

export interface ProductVariationOptionsProps {
  product: Product;
  variations: any[];
  selectedVariationOptions: Record<number, number>;
  onSelect: (variationId: number, valueId: number) => void;
}

export function ProductVariationOptions({
  product,
  variations,
  selectedVariationOptions,
  onSelect,
}: ProductVariationOptionsProps) {
  if (!Array.isArray(variations) || variations.length === 0) return null;

  // Check if a variation value leads to any in-stock variant
  const isValueOutOfStock = (variationId: number, valueId: number): boolean => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (variants.length === 0) return false;

    // Find the UID of this variation value (for string-UID matching)
    let valueUid: string | null = null;
    for (const vr of variations) {
      const vals = Array.isArray(vr?.values) ? vr.values : [];
      const found = vals.find((vv: any) => Number(vv?.id) === valueId);
      if (found) { valueUid = String(found?.uid ?? valueId); break; }
    }

    // Find variants that contain this value
    const matchingVariants = variants.filter((v: any) => {
      const vals = Array.isArray(v?.values) ? v.values : [];
      const uids = String(v?.uids ?? "").split(".").filter(Boolean);
      const valIdStr = String(valueId);
      // Check values array
      const inValues = vals.some((vv: any) => Number(vv?.valueId ?? vv?.id) === valueId);
      // Check uids string (numeric ID or string UID)
      const inUids = uids.includes(valIdStr) || (valueUid ? uids.includes(valueUid) : false);
      return inValues || inUids;
    });

    if (matchingVariants.length === 0) return true;

    // If ALL matching variants are out of stock, this value is out of stock
    return matchingVariants.every((v: any) => {
      const inStock = Boolean(v?.in_stock) || Boolean(v?.is_in_stock) || Boolean(v?.allow_backorder);
      return !inStock;
    });
  };

  return (
    <>
      {variations.map((vr: any) => {
        const vType = String(vr?.type || "text").trim().toLowerCase();
        const vValues = Array.isArray(vr?.values) ? vr.values : [];
        const variationId = Number(vr?.id);
        const activeId = Number(selectedVariationOptions[variationId]);
        const activeLabel = vValues.find((x: any) => Number(x?.id) === activeId)?.label;
        const isDropdownType = vType === "dropdown";

        return (
          <div key={String(vr?.id ?? vr?.name)}>
            <div className="mb-3 font-semibold text-gray-900">
              {vr?.name}:
              <span className="font-normal text-gray-600">
                {" "}
                {activeLabel || ""}
              </span>
            </div>

            <div
              className={cn(
                "flex flex-wrap gap-2",
                vType === "color" && "gap-3",
                vType === "image" && "gap-3"
              )}
            >
              {isDropdownType ? (
                <div className="w-full max-w-sm">
                  <select
                    value={Number.isFinite(activeId) && activeId > 0 ? String(activeId) : ""}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isFinite(next) && next > 0) {
                        onSelect(Number(vr?.id), next);
                      }
                    }}
                    className="h-11 w-full border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-primary"
                  >
                    {!activeId ? <option value="">Seciniz</option> : null}
                    {vValues.map((val: any) => (
                      <option key={String(val?.id ?? val?.label ?? "")} value={String(val?.id ?? "")}>
                        {String(val?.label ?? "")}
                      </option>
                    ))}
                  </select>
                </div>
              ) : vValues.map((val: any) => {
                const isSelected = Number(val?.id) === activeId;
                const label = String(val?.label ?? "").trim();
                const rawValue = String(val?.value ?? "").trim();
                const valUid = String(val?.uid ?? val?.id ?? "");
                const color = String(val?.color ?? rawValue).trim();
                const isButtonType = vType === "button";
                const isPillType = vType === "pill";
                const isRadioType = vType === "radio";

                let imgRaw: any = null;
                if (val?.image_media) {
                  imgRaw = val.image_media.path ?? val.image_media.url ?? null;
                }
                if (!imgRaw && val?.image) {
                  if (typeof val.image === "object") {
                    imgRaw = val.image.path ?? val.image.url ?? null;
                  } else if (typeof val.image === "string") {
                    imgRaw = val.image;
                  }
                }
                if (!imgRaw && vType === "image" && rawValue && rawValue.includes("/")) {
                  imgRaw = rawValue;
                }
                if (!imgRaw && vType === "image") {
                  const valIdStr = String(val?.id ?? "");
                  const matchingVariant = product.variants.find((v: any) => {
                    const uids = String(v?.uids ?? v?.uid ?? "").split(".").filter(Boolean);
                    return uids.includes(valUid) || uids.includes(valIdStr);
                  });
                  if (matchingVariant) {
                    const varMedia = Array.isArray(matchingVariant.media) ? matchingVariant.media[0] : null;
                    if (varMedia) {
                      imgRaw = varMedia.path ?? varMedia.url ?? null;
                    }
                    if (!imgRaw && matchingVariant.base_image) {
                      imgRaw =
                        matchingVariant.base_image.path ??
                        matchingVariant.base_image.url ??
                        matchingVariant.base_image ??
                        null;
                    }
                  }
                }
                if (!imgRaw && vType === "image") {
                  const prodMedia = Array.isArray((product as any)?.media) ? (product as any).media : [];
                  const idx = vValues.indexOf(val);
                  const fallbackMedia = prodMedia[idx] ?? prodMedia[0];
                  if (fallbackMedia) {
                    imgRaw = fallbackMedia.path ?? fallbackMedia.url ?? null;
                  }
                }
                const img = imgRaw ? getImageUrl(imgRaw) : null;

                const outOfStock = isValueOutOfStock(variationId, Number(val?.id));

                if (vType === "color") {
                  const hasValidColor = color && (color.startsWith("#") || color.startsWith("rgb"));
                  return (
                    <button
                      key={String(val?.id ?? label)}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => !outOfStock && onSelect(Number(vr?.id), Number(val?.id))}
                      className={cn(
                        "variation-color h-10 w-10 rounded-full border-2 relative overflow-hidden transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                          : "border-gray-300 hover:border-gray-400 hover:scale-105",
                        outOfStock && "opacity-40 cursor-not-allowed"
                      )}
                      aria-label={label || "Renk"}
                      title={outOfStock ? `${label} - Stokta Yok` : (label || undefined)}
                    >
                      <span
                        className="absolute inset-0.5 rounded-full"
                        style={{ backgroundColor: hasValidColor ? color : "#ccc" }}
                      />
                      {outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block w-[140%] h-[1.5px] bg-gray-500 rotate-45 absolute" />
                        </span>
                      )}
                    </button>
                  );
                }

                if (vType === "image") {
                  return (
                    <button
                      key={String(val?.id ?? label)}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => !outOfStock && onSelect(Number(vr?.id), Number(val?.id))}
                      className={cn(
                        "variation-image flex flex-col items-center gap-1.5 group",
                        outOfStock && "opacity-40 cursor-not-allowed"
                      )}
                      aria-label={label || "Varyant"}
                      title={outOfStock ? `${label} - Stokta Yok` : (label || undefined)}
                    >
                      <div
                        className={cn(
                          "h-16 w-16 rounded-lg border-2 bg-gray-50 overflow-hidden transition-all flex items-center justify-center",
                          isSelected
                            ? "border-primary ring-2 ring-primary ring-offset-1"
                            : "border-gray-200 group-hover:border-gray-400"
                        )}
                      >
                        {img ? (
                          <img src={img} alt={label || product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs text-center leading-tight max-w-[64px] truncate",
                          isSelected ? "text-primary font-medium" : "text-gray-600",
                          outOfStock && "line-through"
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  );
                }

                if (isRadioType) {
                  return (
                    <button
                      key={String(val?.id ?? label)}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => !outOfStock && onSelect(Number(vr?.id), Number(val?.id))}
                      className={cn(
                        "h-10 px-3 border text-sm transition-all flex items-center gap-2",
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                        outOfStock && "opacity-40 cursor-not-allowed"
                      )}
                      title={outOfStock ? `${label} - Stokta Yok` : undefined}
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center",
                          isSelected ? "border-primary" : "border-gray-400"
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", isSelected ? "bg-primary" : "bg-transparent")} />
                      </span>
                      <span className={cn(outOfStock && "line-through")}>{label}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={String(val?.id ?? label)}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => !outOfStock && onSelect(Number(vr?.id), Number(val?.id))}
                    className={cn(
                      "variation-text h-10 px-4 border-2 text-sm font-medium transition-all relative",
                      isButtonType && "rounded-none",
                      isPillType && "rounded-full",
                      !isButtonType && !isPillType && "rounded-lg",
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                      outOfStock && "opacity-50 line-through cursor-not-allowed"
                    )}
                    title={outOfStock ? `${label} - Stokta Yok` : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
