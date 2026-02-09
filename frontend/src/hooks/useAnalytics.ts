import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface AnalyticsParams {
    startDate?: string;
    endDate?: string;
    compareWith?: 'yesterday' | 'last_week' | 'last_month' | 'last_year';
    interval?: 'hour' | 'day';
    limit?: number;
    type?: 'revenue' | 'quantity';
}

export function useAnalytics<T = any>(
    endpoint: string,
    params: AnalyticsParams = {},
    options: { enabled?: boolean; refreshInterval?: number } = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });

            const url = queryParams.toString()
                ? `${endpoint}?${queryParams.toString()}`
                : endpoint;

            console.log('[useAnalytics] Fetching:', url);

            const response = await apiFetch<T>(url, { method: 'GET' });
            setData(response);
            console.log('[useAnalytics] Success:', response);
        } catch (err: any) {
            const errorMessage = err?.message || err?.error || 'Failed to fetch analytics';
            const errorObj = new Error(errorMessage);
            setError(errorObj);
            console.error('[useAnalytics] Error:', {
                message: errorMessage,
                status: err?.status,
                details: err?.details,
                endpoint,
                params,
            });
        } finally {
            setLoading(false);
        }
    }, [endpoint, JSON.stringify(params)]);

    useEffect(() => {
        if (options.enabled !== false) {
            fetchData();
        }
    }, [fetchData, options.enabled]);

    // Auto-refresh if interval is set
    useEffect(() => {
        if (options.refreshInterval && options.enabled !== false) {
            const intervalId = setInterval(fetchData, options.refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [fetchData, options.refreshInterval, options.enabled]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
}
