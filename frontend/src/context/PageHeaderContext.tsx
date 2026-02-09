"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { MenuProps } from 'antd';

type PageHeaderState = {
    title: string;
    breadcrumb?: { href?: string; label: string }[];
    onBack?: () => void;
    onSave?: () => void;
    saving?: boolean;
    extra?: React.ReactNode;
    footer?: React.ReactNode;
    actions?: MenuProps['items'];
    variant: 'dark' | 'light';
};

type PageHeaderActions = {
    setHeader: (state: Partial<PageHeaderState>) => void;
    clearHeader: () => void;
};

const defaultState: PageHeaderState = {
    title: '',
    variant: 'light',
};

const PageHeaderStateContext = createContext<PageHeaderState | undefined>(undefined);
const PageHeaderActionContext = createContext<PageHeaderActions | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
    const [headerState, setHeaderState] = useState<PageHeaderState>(defaultState);

    const setHeader = useCallback((state: Partial<PageHeaderState>) => {
        setHeaderState((prev) => ({ ...prev, ...state }));
    }, []);

    const clearHeader = useCallback(() => {
        setHeaderState(defaultState);
    }, []);

    const actions = useMemo(() => ({ setHeader, clearHeader }), [setHeader, clearHeader]);

    return (
        <PageHeaderActionContext.Provider value={actions}>
            <PageHeaderStateContext.Provider value={headerState}>
                {children}
            </PageHeaderStateContext.Provider>
        </PageHeaderActionContext.Provider>
    );
}

export function usePageHeaderState() {
    const context = useContext(PageHeaderStateContext);
    if (context === undefined) {
        throw new Error('usePageHeaderState must be used within PageHeaderProvider');
    }
    return context;
}

export function usePageHeaderActions() {
    const context = useContext(PageHeaderActionContext);
    if (context === undefined) {
        throw new Error('usePageHeaderActions must be used within PageHeaderProvider');
    }
    return context;
}

export function useOptionalPageHeaderActions() {
    return useContext(PageHeaderActionContext) ?? null;
}

export function usePageHeaderContext() {
    return {
        headerState: usePageHeaderState(),
        ...usePageHeaderActions()
    };
}
