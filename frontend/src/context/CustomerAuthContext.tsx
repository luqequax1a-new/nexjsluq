"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { customerApiFetch, csrfCookie } from "@/lib/api";
import type { ApiError } from "@/lib/api";

export type CustomerUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
};

export type CustomerMeResponse = {
  customer: CustomerUser | null;
};

interface CustomerAuthContextType {
  me: CustomerMeResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    accepts_marketing?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const CUSTOMER_TOKEN_KEY = "customer_token";
const CUSTOMER_ME_KEY = "customer_me";

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

function saveCachedMe(me: CustomerMeResponse | null) {
  if (typeof window === "undefined") return;
  if (!me?.customer) {
    localStorage.removeItem(CUSTOMER_ME_KEY);
    return;
  }
  localStorage.setItem(CUSTOMER_ME_KEY, JSON.stringify(me));
}

function loadCachedMe(): CustomerMeResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CUSTOMER_ME_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CustomerMeResponse;
    if (parsed && typeof parsed === "object" && "customer" in parsed) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<CustomerMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshInternal = useCallback(async (silent: boolean) => {
    if (!silent) setLoading(true);
    try {
      const res = await customerApiFetch<CustomerMeResponse>("/api/storefront/auth/me", { method: "GET" });
      setMe(res);
      saveCachedMe(res);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (typeof window !== "undefined" && err?.status === 401) {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        localStorage.removeItem(CUSTOMER_ME_KEY);
        setMe(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await refreshInternal(false);
  }, [refreshInternal]);

  useEffect(() => {
    const hasToken = typeof window !== "undefined" ? Boolean(localStorage.getItem(CUSTOMER_TOKEN_KEY)) : false;
    if (!hasToken) {
      setMe(null);
      setLoading(false);
      return;
    }

    const cached = loadCachedMe();
    if (cached?.customer) {
      setMe(cached);
      setLoading(false);
      void refreshInternal(true);
      return;
    }

    void refreshInternal(false);
  }, [refreshInternal]);

  const login = useCallback(async (email: string, password: string) => {
    await csrfCookie();
    const res = await customerApiFetch<{ customer: CustomerUser; token?: string }>(
      "/api/storefront/auth/login",
      {
        method: "POST",
        json: { email, password },
      }
    );

    if (typeof window !== "undefined" && res?.token) {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, res.token);
    }

    if (res?.customer) {
      const mePayload = { customer: res.customer };
      setMe(mePayload);
      saveCachedMe(mePayload);
      setLoading(false);
      return;
    }

    await refresh();
  }, [refresh]);

  const register = useCallback(async (payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    accepts_marketing?: boolean;
  }) => {
    await csrfCookie();
    const res = await customerApiFetch<{ customer: CustomerUser; token?: string }>(
      "/api/storefront/auth/register",
      {
        method: "POST",
        json: payload,
      }
    );

    if (typeof window !== "undefined" && res?.token) {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, res.token);
    }

    if (res?.customer) {
      const mePayload = { customer: res.customer };
      setMe(mePayload);
      saveCachedMe(mePayload);
      setLoading(false);
      return;
    }

    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await customerApiFetch("/api/storefront/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_ME_KEY);
    }
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ me, loading, refresh, login, register, logout }),
    [me, loading, refresh, login, register, logout]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
