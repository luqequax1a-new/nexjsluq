"use client";

export type Dict = Record<string, any>;

export function translate(dict: Dict, key: string, fallback?: string): string {
  const parts = key.split(".").filter(Boolean);
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return fallback || key;
  }
  return typeof cur === "string" ? cur : (fallback || key);
}

// Internal dictionary for global usage (e.g. non-react contexts)
let globalDict: Dict = {};

export function setGlobalTranslations(dict: Dict) {
  globalDict = dict;
}

export function t(key: string, fallback?: string): string {
  return translate(globalDict, key, fallback);
}

// For backward compatibility or specific admin usages
export const tAdmin = t;
