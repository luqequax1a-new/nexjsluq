"use client";

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export function useProductTags() {
    const [tagOptions, setTagOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [tagLoading, setTagLoading] = useState(false);

    const searchTags = useCallback(async (q: string) => {
        try {
            setTagLoading(true);
            const res = await apiFetch<Array<{ id: number; name: string }>>(
                `/api/tags?query=${encodeURIComponent(q || "")}&limit=20`,
                { method: "GET" },
            );
            const uniqueNames = Array.from(new Set((res || []).map(t => t.name)));
            setTagOptions(uniqueNames.map((name) => ({ value: name, label: name })));
        } catch {
            // ignore
        } finally {
            setTagLoading(false);
        }
    }, []);

    // Sayfa başında veya focus olduğunda bazı etiketleri getir
    useEffect(() => {
        void searchTags("");
    }, [searchTags]);

    return { tagOptions, tagLoading, searchTags };
}
