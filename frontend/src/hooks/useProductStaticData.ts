"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Unit } from '@/hooks/useUnit';

export function useProductStaticData() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [taxClasses, setTaxClasses] = useState<Array<{ id: number; label: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            // Small delay to ensure hydration/auth ready
            await new Promise(r => setTimeout(r, 100));
            if (!isMounted) return;

            try {
                setLoading(true);
                const [unitsRes, taxRes] = await Promise.all([
                    apiFetch<any>("/api/units?active_only=1"),
                    apiFetch<Array<{ id: number; label: string }>>("/api/tax-classes", { method: "GET" })
                ]);

                if (isMounted) {
                    setUnits(Array.isArray(unitsRes) ? unitsRes : (unitsRes.data || []));
                    setTaxClasses(taxRes);
                }
            } catch (e) {
                if (isMounted) console.error("Product static data could not be loaded", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void fetchData();

        return () => { isMounted = false; };
    }, []);

    return { units, taxClasses, loading };
}
