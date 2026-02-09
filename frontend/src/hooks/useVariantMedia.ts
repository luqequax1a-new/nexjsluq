import { useCallback } from 'react';
import { FormInstance } from 'antd';
import type { MediaItem } from '@/types/media';

/**
 * Custom hook for managing variant media in AntD Form
 * Handles nested array updates and ensures proper re-rendering
 */
export function useVariantMedia(form: FormInstance | undefined, variantIndex: number) {
    const setMedia = useCallback((items: MediaItem[]) => {
        if (!form) return;

        const mediaIds = items.map(m => Number(m.id)).filter(id => id > 0);

        // Use setFields for better reactivity with nested arrays
        form.setFields([
            {
                name: ['variants', variantIndex, 'media'],
                value: items
            },
            {
                name: ['variants', variantIndex, 'media_ids'],
                value: mediaIds
            },
        ]);

        // Force re-render by updating the full variants array with a new reference
        // This ensures VariantTable and other watchers detect the change
        const currentVariants = form.getFieldValue(['variants']) ?? [];
        if (Array.isArray(currentVariants)) {
            form.setFieldsValue({ variants: [...currentVariants] });
        }

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
            console.log('[useVariantMedia] setMedia', {
                variantIndex,
                itemCount: items.length,
                mediaIds,
            });
        }
    }, [form, variantIndex]);

    return { setMedia };
}
