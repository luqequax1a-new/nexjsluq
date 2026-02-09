"use client";

import React from "react";
import { I18nProvider } from "@/context/I18nContext";
import { StorefrontSettingsProvider, StorefrontSettings } from "@/context/StorefrontSettingsContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";

export default function StorefrontProviders({
  children,
  locale,
  initialSettings,
}: {
  children: React.ReactNode;
  locale?: string;
  initialSettings?: StorefrontSettings;
}) {
  return (
    <I18nProvider initialLocale={locale}>
      <StorefrontSettingsProvider initial={initialSettings}>
        <CustomerAuthProvider>{children}</CustomerAuthProvider>
      </StorefrontSettingsProvider>
    </I18nProvider>
  );
}
