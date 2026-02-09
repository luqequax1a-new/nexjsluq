"use client";

// Bu dosya geriye dönük uyumluluk için context'teki değerleri export eder.
export { useAuth, hasPermission } from "@/context/AuthContext";
export type { AuthUser, MeResponse } from "@/context/AuthContext";
