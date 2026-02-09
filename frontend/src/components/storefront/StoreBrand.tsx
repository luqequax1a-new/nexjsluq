"use client";

import React from "react";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";

export default function StoreBrand({ fallback }: { fallback: string }) {
  const { settings } = useStorefrontSettings();
  return <>{settings.store_name || fallback}</>;
}
