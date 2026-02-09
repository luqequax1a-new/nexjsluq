'use client';

import { useState, useEffect, useMemo } from 'react';
import { customerApiFetch } from '@/lib/api';
import { getImageUrl } from '@/lib/media/getImageUrl';
import { formatPrice, cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface CartOfferModalProps {
    offer: any;
    onClose: () => void;
}

type Step = 'preview' | 'variants' | 'quantity';

export default function CartOfferModal({ offer, onClose }: CartOfferModalProps) {
    const { fetchCart, setIsOpen: openCartDrawer } = useCart();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [countdown, setCountdown] = useState(-1);
    const [countdownTotal, setCountdownTotal] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>('preview');
    const [isEditingQty, setIsEditingQty] = useState(false);
    const [qtyInput, setQtyInput] = useState("");

    const currentProductItem = offer.products[currentIndex];

    // Parse display_config robustly (might be string or object)
    const displayConfig = useMemo(() => {
        const raw = offer.display_config;
        if (!raw) return {};
        if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
        return raw;
    }, [offer.display_config]);

    const offerTitle = offer.title || offer.name;
    const badgeText = displayConfig.badge_text || 'ÖZEL FIRSAT';
    const badgeColor = displayConfig.badge_color || '#4f46e5';
    const offerDescription = offer.description;
    const showProductImage = displayConfig.show_product_image !== false;
    const showOriginalPrice = displayConfig.show_original_price !== false;
    const autoCloseOnAdd = displayConfig.auto_close_on_add !== false;
    const acceptButtonText = displayConfig.accept_button_text || 'Teklifi Kabul Et';
    const rejectButtonText = displayConfig.reject_button_text || 'Hayır, teşekkürler';
    const modalSize = displayConfig.modal_size || 'medium';
    const modalMaxWidth = modalSize === 'small' ? 'sm:max-w-[380px]' : modalSize === 'large' ? 'sm:max-w-[520px]' : 'sm:max-w-[440px]';

    // --- Unit / Quantity logic (mirrors ProductDetail exactly) ---
    const unit = currentProductItem?.unit;
    const rawDecimal = unit?.is_decimal_stock ?? unit?.is_decimal;
    const isDecimalAllowed = rawDecimal === true || rawDecimal === 1
        || String(rawDecimal).toLowerCase() === 'true' || String(rawDecimal).toLowerCase() === '1';
    const precision = isDecimalAllowed ? 2 : 0;
    const minQty = Number.isFinite(Number(unit?.min)) ? Number(unit.min) : 1;
    const maxQty = unit?.max !== null && unit?.max !== undefined && unit?.max !== ""
        ? Number(unit.max) : null;
    const stepQtyRaw = Number(unit?.step ?? (isDecimalAllowed ? 0.1 : 1));
    const stepQty = Number.isFinite(stepQtyRaw) && stepQtyRaw > 0 ? stepQtyRaw : (isDecimalAllowed ? 0.1 : 1);

    const unitLabel = String(unit?.label || "").trim();
    const unitName = String(unit?.name || unit?.short_name || "").trim();
    const unitQtyPrefix = String(unit?.quantity_prefix || "").trim();
    const unitSuffix = String(unit?.suffix || unit?.stock_prefix || "").trim();
    const displayChipSuffix = unitQtyPrefix || "";
    const chips = isDecimalAllowed ? [0.5, 1, 2.5, 5, 10] : [1, 2, 3, 5, 10];

    const roundQty = (v: number) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return minQty;
        const clampedMin = Math.max(minQty, n);
        const clamped = maxQty !== null && Number.isFinite(maxQty) ? Math.min(maxQty, clampedMin) : clampedMin;
        if (precision === 0) return Math.round(clamped);
        return Number(clamped.toFixed(precision));
    };

    const alignToStep = (v: number) => {
        const base = Number.isFinite(minQty) ? minQty : 0;
        const steps = Math.round((v - base) / stepQty);
        return base + steps * stepQty;
    };

    const normalizeQtyStep = (v: number) => roundQty(alignToStep(v));
    const normalizeQtyManual = (v: number) => roundQty(v);

    const incrementQty = () => setQuantity((q) => {
        const next = Number((Number(q) + stepQty).toFixed(10));
        return normalizeQtyStep(next);
    });
    const decrementQty = () => setQuantity((q) => {
        const next = Number((Number(q) - stepQty).toFixed(10));
        return normalizeQtyStep(next);
    });

    const isDecrementDisabled = Number((quantity - stepQty).toFixed(10)) < minQty;
    const isIncrementDisabled = maxQty !== null && Number((quantity + stepQty).toFixed(10)) > maxQty;

    const parseQtyInput = (raw: string) => {
        const s = String(raw || "").replace(",", ".").trim();
        const n = Number(s);
        if (!Number.isFinite(n)) return null;
        return n;
    };

    const sanitizeQtyInput = (raw: string) => String(raw || "").replace(/[^0-9,\.]/g, "");

    const formatQtyForOverlay = (qty: number) => {
        if (isDecimalAllowed) {
            const fixed = Number(qty).toFixed(2);
            return fixed.replace(/\.00$/, "");
        }
        return String(Math.round(Number(qty)));
    };

    const beginEditQty = () => { setIsEditingQty(true); setQtyInput(""); };
    const cancelEditQty = () => { setIsEditingQty(false); setQtyInput(""); };
    const commitEditQty = () => {
        const raw = String(qtyInput || "").trim();
        if (!raw) { cancelEditQty(); return; }
        const n = parseQtyInput(raw);
        if (n === null) { cancelEditQty(); return; }
        setQuantity(normalizeQtyManual(n));
        setIsEditingQty(false);
        setQtyInput("");
    };

    // --- Effects ---
    useEffect(() => {
        const enabled = displayConfig.countdown_enabled === true || displayConfig.countdown_enabled === 'true' || displayConfig.countdown_enabled === 1;
        const minutes = Number(displayConfig.countdown_minutes);
        if (enabled && Number.isFinite(minutes) && minutes > 0) {
            const total = Math.max(1, Math.round(minutes * 60));
            setCountdown(total);
            setCountdownTotal(total);
        } else {
            setCountdown(-1);
            setCountdownTotal(-1);
        }
    }, [offer, displayConfig.countdown_enabled, displayConfig.countdown_minutes]);

    useEffect(() => {
        if (currentProductItem) {
            setSelectedVariantId(currentProductItem.variant_id || null);
            const defQty = Number(unit?.default_qty ?? unit?.min ?? 1);
            setQuantity(Number.isFinite(defQty) && defQty > 0 ? defQty : 1);
            setStep('preview');
            setIsEditingQty(false);
            setQtyInput("");
        }
    }, [currentIndex, currentProductItem]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            onClose();
        }
    }, [countdown, onClose]);

    // Body scroll lock
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    // Escape key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleInitialAction = () => {
        if (currentProductItem.allow_variant_selection && currentProductItem.variants?.length > 0) {
            setStep('variants');
        } else {
            setStep('quantity');
        }
    };

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await customerApiFetch('/api/cart/offers/accept', {
                method: 'POST',
                json: {
                    offer_id: offer.id,
                    product_id: currentProductItem.product_id,
                    variant_id: selectedVariantId,
                    quantity: quantity,
                },
            });

            await fetchCart();
            if (autoCloseOnAdd) openCartDrawer(true);

            const nextIndex = offer.products.findIndex((p: any, i: number) =>
                i > currentIndex && (p.show_condition === 'always' || p.show_condition === 'if_accepted')
            );
            if (nextIndex !== -1) {
                setCurrentIndex(nextIndex);
            } else {
                onClose();
                if (autoCloseOnAdd) openCartDrawer(true);
            }
        } catch (error: any) {
            console.error('Cart offer accept error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!currentProductItem) return null;

    const discountPercent = currentProductItem.discount_percentage;
    const discountedPrice = currentProductItem.discounted_price;
    const basePrice = currentProductItem.base_price;

    const getVariantThumb = (v: any) => {
        const media = Array.isArray(v?.media) ? v.media : [];
        const first = media[0];
        if (first) return getImageUrl(first);
        if (v?.base_image_thumb?.url || v?.base_image_thumb?.path) return getImageUrl(v.base_image_thumb);
        if (v?.image) return getImageUrl(v.image);
        return getImageUrl(currentProductItem.image);
    };

    const showDecimalQuantityCard = isDecimalAllowed;
    const countdownPct = countdownTotal > 0 ? (countdown / countdownTotal) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[2000]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px]" onClick={onClose} />

            {/* Modal */}
            <div
                className={`absolute inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full ${modalMaxWidth}`}
                style={{ animation: 'offerSlideUp .35s cubic-bezier(.16,1,.3,1) both' }}
            >
                <div className="bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col">

                    {/* Countdown bar */}
                    {countdown > 0 && (
                        <div className="h-1 w-full bg-gray-100 flex-shrink-0">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all ease-linear duration-1000"
                                style={{ width: `${countdownPct}%` }}
                            />
                        </div>
                    )}

                    {/* Drag handle (mobile) */}
                    <div className="flex justify-center pt-3 pb-0 sm:hidden flex-shrink-0">
                        <div className="w-9 h-1 rounded-full bg-gray-200" />
                    </div>

                    {/* Header */}
                    <div className="px-5 pt-3 sm:pt-4 pb-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            {step !== 'preview' && (
                                <button
                                    onClick={() => step === 'quantity' && currentProductItem.allow_variant_selection && currentProductItem.variants?.length > 0 ? setStep('variants') : setStep('preview')}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                                </button>
                            )}
                            {step === 'preview' && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-flex items-center gap-1 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider"
                                        style={{ backgroundColor: badgeColor }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                        {badgeText}
                                    </span>
                                </div>
                            )}
                            {step !== 'preview' && (
                                <span className="text-[15px] font-bold text-gray-900 truncate">
                                    {step === 'variants' ? 'Varyant Seçin' : 'Miktar Belirleyin'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {countdown > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span className="text-[11px] font-extrabold text-red-600 tabular-nums">{formatTime(countdown)}</span>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        <div className="px-5 pb-5">

                            {/* ===== PREVIEW ===== */}
                            {step === 'preview' && (
                                <div>
                                    {/* Product card: image left, info right */}
                                    <div className="flex gap-4 mb-4">
                                        {showProductImage && (
                                            <div className="relative w-[90px] h-[90px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                                                <img
                                                    src={getImageUrl(currentProductItem.image)}
                                                    alt={currentProductItem.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                {discountPercent > 0 && (
                                                    <div className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                                                        %{discountPercent}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
                                                {currentProductItem.name}
                                            </h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[18px] font-extrabold text-gray-900 leading-none">
                                                    {formatPrice(discountedPrice)}
                                                </span>
                                                {showOriginalPrice && basePrice > discountedPrice && (
                                                    <span className="text-[12px] text-gray-400 line-through font-medium">
                                                        {formatPrice(basePrice)}
                                                    </span>
                                                )}
                                                {unitSuffix && (
                                                    <span className="text-[11px] text-gray-400 font-medium">/{unitSuffix}</span>
                                                )}
                                            </div>
                                            {discountPercent > 0 && basePrice > discountedPrice && (
                                                <span className="text-[11px] font-semibold text-green-600 mt-1">
                                                    {formatPrice(basePrice - discountedPrice)} tasarruf
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {offerDescription && (
                                        <p className="text-[12px] text-gray-500 leading-relaxed mb-3">
                                            {offerDescription}
                                        </p>
                                    )}

                                    {/* Buttons side by side */}
                                    <div className="flex gap-2.5">
                                        <button
                                            onClick={() => {
                                                const nextIndex = offer.products.findIndex((p: any, i: number) =>
                                                    i > currentIndex && (p.show_condition === 'always' || p.show_condition === 'if_rejected')
                                                );
                                                if (nextIndex !== -1) {
                                                    setCurrentIndex(nextIndex);
                                                    setStep('preview');
                                                } else {
                                                    onClose();
                                                }
                                            }}
                                            className="h-[42px] px-5 rounded-xl text-[13px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all flex-shrink-0"
                                        >
                                            {rejectButtonText}
                                        </button>
                                        <button
                                            onClick={handleInitialAction}
                                            className="flex-1 h-[42px] rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                            style={{ backgroundColor: badgeColor }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                            {acceptButtonText}
                                        </button>
                                    </div>

                                    {/* Dots */}
                                    {offer.products.length > 1 && (
                                        <div className="flex justify-center gap-1.5 mt-2">
                                            {offer.products.map((_: any, idx: number) => (
                                                <div key={idx} className={cn("h-1 rounded-full transition-all duration-500", idx === currentIndex ? 'w-6 bg-indigo-600' : 'w-1.5 bg-gray-200')} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ===== VARIANTS ===== */}
                            {step === 'variants' && (
                                <div className="space-y-2 max-h-[55vh] overflow-y-auto overscroll-contain offer-scrollbar">
                                    {currentProductItem.variants.map((v: any) => {
                                        const isSelected = selectedVariantId === v.id;
                                        const thumb = getVariantThumb(v);
                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    setSelectedVariantId(v.id);
                                                    const vUnit = v.unit || unit;
                                                    const defQty = Number(vUnit?.default_qty ?? vUnit?.min ?? 1);
                                                    setQuantity(Number.isFinite(defQty) && defQty > 0 ? defQty : 1);
                                                    setStep('quantity');
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                                                    isSelected
                                                        ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500/20"
                                                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden border flex items-center justify-center bg-white",
                                                    isSelected ? "border-indigo-200" : "border-gray-100"
                                                )}>
                                                    <img src={thumb} alt={v.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn("text-[13px] font-bold truncate", isSelected ? "text-indigo-700" : "text-gray-800")}>
                                                        {v.name}
                                                    </div>
                                                    {v.price != null && (
                                                        <div className="text-[12px] font-extrabold text-gray-600 mt-0.5">
                                                            {formatPrice(v.price)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                                    isSelected ? "bg-indigo-600 text-white" : "border-2 border-gray-200"
                                                )}>
                                                    {isSelected && (
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ===== QUANTITY - Uses exact same decimal-quantity-card as ProductDetail ===== */}
                            {step === 'quantity' && (
                                <div>
                                    <div className="decimal-quantity-card">
                                        <div className="decimal-quantity-header">
                                            <div>
                                                <div className="decimal-quantity-title">
                                                    <span>{unitLabel || (isDecimalAllowed ? "Uzunluk" : "Miktar")}</span>
                                                    {unitName ? <> (<span>{unitName}</span>)</> : null}
                                                </div>
                                                <div className="decimal-quantity-desc">{unit?.info_top || ""}</div>
                                            </div>
                                        </div>

                                        <div className="decimal-quantity-main">
                                            <button
                                                type="button"
                                                className="btn-quantity minus"
                                                disabled={isDecrementDisabled}
                                                onClick={decrementQty}
                                            >
                                                −
                                            </button>

                                            <div className="decimal-quantity-input">
                                                <span className="input-overlay">
                                                    {formatQtyForOverlay(quantity)}
                                                    {displayChipSuffix}
                                                </span>
                                                <input
                                                    type="text"
                                                    inputMode={isDecimalAllowed ? "decimal" : "numeric"}
                                                    value={isEditingQty ? qtyInput : String(quantity)}
                                                    autoComplete="off"
                                                    min={minQty}
                                                    max={maxQty ?? undefined}
                                                    aria-label="Miktar"
                                                    className="form-control input-quantity-decimal input-overlay-target"
                                                    onFocus={(e) => { beginEditQty(); queueMicrotask(() => e.currentTarget.select()); }}
                                                    onBlur={() => { if (isEditingQty) commitEditQty(); }}
                                                    onChange={(e) => { try { if (e?.target?.value) setQtyInput(sanitizeQtyInput(e.target.value)); } catch {} }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") { e.preventDefault(); commitEditQty(); }
                                                        else if (e.key === "Escape") { e.preventDefault(); cancelEditQty(); }
                                                        else if (e.key === "ArrowUp") { e.preventDefault(); incrementQty(); }
                                                        else if (e.key === "ArrowDown") { e.preventDefault(); decrementQty(); }
                                                    }}
                                                />
                                                <span className="input-suffix">{unit?.suffix || ""}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn-quantity plus"
                                                disabled={isIncrementDisabled}
                                                onClick={incrementQty}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="decimal-quantity-chips">
                                            {chips.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    className={cn("chip", c === 5 ? "chip--desktop-only" : "")}
                                                    disabled={(maxQty !== null && c > maxQty) || c < minQty}
                                                    onClick={() => setQuantity(normalizeQtyStep(c))}
                                                >
                                                    {c}
                                                    <span>{displayChipSuffix}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="decimal-quantity-info">{unit?.info_bottom || ""}</div>

                                        <button
                                            className="btn btn-primary btn-add-to-cart"
                                            onClick={handleConfirm}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                                    {loading ? 'Ekleniyor...' : 'Sepete Ekle'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* iOS safe area */}
                    <div className="h-[env(safe-area-inset-bottom,0px)] flex-shrink-0 bg-white" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes offerSlideUp {
                    from { transform: translateY(100%); opacity: 0.5; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .offer-scrollbar::-webkit-scrollbar { width: 3px; }
                .offer-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .offer-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
