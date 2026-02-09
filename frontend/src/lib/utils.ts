import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    }).format(price)
}

export function formatCount(value: number, maxDecimals = 3): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    const fixed = n.toFixed(maxDecimals);
    return fixed.replace(/\.?0+$/, "");
}
