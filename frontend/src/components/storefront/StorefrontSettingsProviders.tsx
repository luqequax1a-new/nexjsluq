"use client";

import React from "react";
import { StorefrontSettings, StorefrontSettingsProvider } from "@/context/StorefrontSettingsContext";

export default function StorefrontSettingsProviders({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: StorefrontSettings;
}) {
  return <StorefrontSettingsProvider initial={initial}>{children}</StorefrontSettingsProvider>;
}
