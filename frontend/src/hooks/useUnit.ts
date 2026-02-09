import { useMemo } from 'react';

export interface Unit {
    id: number;
    name: string;
    label: string;
    short_name: string;
    suffix: string;
    quantity_prefix?: string | null;
    min: number;
    max: number | null;
    step: number;
    default_qty: number;
    price_prefix: string | null;
    stock_prefix: string | null;
    is_decimal_stock: boolean;
    is_active: boolean;
}

export function useUnit(unitInput: number | any | null | undefined, units: Unit[]) {
    const selectedUnit = useMemo(() => {
        if (!unitInput) return null;
        if (typeof unitInput === 'object') return unitInput;
        return units.find(u => u.id === unitInput) || null;
    }, [unitInput, units]);

    const isDecimalAllowed = useMemo(() => {
        return selectedUnit?.is_decimal_stock ?? false;
    }, [selectedUnit]);

    const inputMode: "decimal" | "numeric" = useMemo(() => {
        return isDecimalAllowed ? 'decimal' : 'numeric';
    }, [isDecimalAllowed]);

    const step = useMemo(() => {
        if (!selectedUnit) return 1;
        return isDecimalAllowed ? (selectedUnit.step || 0.1) : 1;
    }, [selectedUnit, isDecimalAllowed]);

    const precision = useMemo(() => {
        return isDecimalAllowed ? 2 : 0;
    }, [isDecimalAllowed]);

    const formatQuantity = (qty: number | null | undefined): string => {
        if (qty === null || qty === undefined) return '0';
        if (!selectedUnit) return qty.toString();

        const formatted = isDecimalAllowed
            ? parseFloat(qty.toFixed(2))
            : Math.round(qty);

        return selectedUnit.stock_prefix
            ? `${formatted} ${selectedUnit.stock_prefix}`
            : formatted.toString();
    };

    const formatPrice = (price: number | null | undefined): string => {
        if (price === null || price === undefined) return '₺0';
        if (!selectedUnit) return `₺${price}`;

        return selectedUnit.price_prefix
            ? `₺${price}${selectedUnit.price_prefix}`
            : `₺${price}`;
    };

    const normalizeQuantity = (qty: number): number => {
        if (!selectedUnit) return qty;

        return isDecimalAllowed
            ? parseFloat(qty.toFixed(2))
            : Math.round(qty);
    };

    const validateQuantity = (qty: number): { valid: boolean; error?: string } => {
        if (!selectedUnit) return { valid: true };

        const min = selectedUnit.min || 0;
        if (qty < min) {
            return {
                valid: false,
                error: `Minimum miktar: ${min} ${selectedUnit.stock_prefix || ''}`
            };
        }

        if (selectedUnit.max && qty > selectedUnit.max) {
            return {
                valid: false,
                error: `Maximum miktar: ${selectedUnit.max} ${selectedUnit.stock_prefix || ''}`
            };
        }

        if (!isDecimalAllowed && qty % 1 !== 0) {
            return {
                valid: false,
                error: 'Bu birim ondalık sayı desteklemiyor.'
            };
        }

        return { valid: true };
    };

    return {
        selectedUnit,
        isDecimalAllowed,
        inputMode,
        step,
        precision,
        formatQuantity,
        formatPrice,
        normalizeQuantity,
        validateQuantity,
    };
}
