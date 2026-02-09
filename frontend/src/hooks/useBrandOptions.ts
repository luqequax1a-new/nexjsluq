import { useState, useEffect } from 'react';
import { getBrands } from '@/lib/api/brands';
import { Brand } from '@/types/brand';

export function useBrandOptions() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const response = await getBrands({ is_active: true, paginate: false });
            setBrands(Array.isArray(response) ? response : response.brands || []);
        } catch (error) {
            console.error('Markalar yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const brandOptions = Array.from(new Map(brands.map(brand => [brand.id, {
        value: brand.id,
        label: brand.name,
    }])).values());

    return { brands, brandOptions, loading };
}
