"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";

export default function T({
  k,
  fallback,
}: {
  k: string;
  fallback?: string;
}) {
  const { t } = useI18n();
  return <>{t(k, fallback)}</>;
}
