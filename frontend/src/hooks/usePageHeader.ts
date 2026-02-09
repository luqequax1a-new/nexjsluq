"use client";

import { useEffect, useRef } from 'react';
import { usePageHeaderActions } from '@/context/PageHeaderContext';
import { MenuProps } from 'antd';

type UsePageHeaderProps = {
    title: string;
    breadcrumb?: { href?: string; label: string }[];
    onBack?: () => void;
    onSave?: () => void;
    saving?: boolean;
    extra?: React.ReactNode;
    footer?: React.ReactNode;
    actions?: MenuProps['items'];
    variant?: 'dark' | 'light';
};

export function usePageHeader({
    title,
    breadcrumb,
    onBack,
    onSave,
    saving,
    extra,
    footer,
    actions,
    variant = 'light',
}: UsePageHeaderProps) {
    const { setHeader, clearHeader } = usePageHeaderActions();

    useEffect(() => {
        setHeader({
            title,
            breadcrumb,
            onBack,
            onSave,
            saving,
            extra,
            footer,
            actions,
            variant,
        });
    }, [title, breadcrumb, onBack, onSave, saving, extra, footer, actions, variant, setHeader]);

    useEffect(() => {
        return () => clearHeader();
    }, [clearHeader]);
}
