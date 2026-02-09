"use client";

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { adminApiFetch, csrfCookie } from "@/lib/api";
import type { ApiError } from "@/lib/api";

export type AuthUser = {
    id: number;
    name: string;
    email: string;
};

export type MeResponse = {
    user: AuthUser | null;
    roles: string[];
    permissions: string[];
};

interface AuthContextType {
    me: MeResponse | null;
    loading: boolean;
    refresh: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminApiFetch<MeResponse>("/api/auth/me", { method: "GET" });
            setMe(res);
        } catch (e: unknown) {
            const err = e as ApiError;
            // If token is missing/invalid, stop future refresh attempts by clearing it.
            if (typeof window !== 'undefined' && err?.status === 401) {
                localStorage.removeItem('admin_token');
            }
            setMe(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const hasToken = typeof window !== "undefined" ? Boolean(localStorage.getItem("admin_token")) : false;

        // Only auto-refresh when we have a token. Without a token, 401 is expected.
        // Login page calls refresh() after successful login anyway.
        if (!hasToken) {
            setMe(null);
            setLoading(false);
            return;
        }

        void refresh();
    }, [refresh]);

    const login = useCallback(async (email: string, password: string) => {
        await csrfCookie();

        const res = await adminApiFetch<{ user: AuthUser; token?: string }>("/api/auth/login", {
            method: "POST",
            json: { email, password },
        });

        if (typeof window !== 'undefined') {
            if (res?.token) localStorage.setItem('admin_token', res.token);
        }

        await refresh();
    }, [refresh]);

    const logout = useCallback(async () => {
        await adminApiFetch("/api/auth/logout", { method: "POST" });
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
        }
        setMe(null);
    }, []);

    const value = useMemo(
        () => ({ me, loading, refresh, login, logout }),
        [me, loading, refresh, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function hasPermission(me: MeResponse | null, permission: string): boolean {
    if (!me?.user || !me.roles) return false;
    const roles = Array.isArray(me.roles) ? me.roles : [];
    if (roles.includes("SuperAdmin")) return true;
    const permissions = Array.isArray(me.permissions) ? me.permissions : [];
    return permissions.includes(permission);
}
