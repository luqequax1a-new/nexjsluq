"use client";

import { ReactNode } from "react";
import { MeResponse, hasPermission } from "@/lib/auth";

export function PermissionGate({
  me,
  permission,
  children,
  fallback,
}: {
  me: MeResponse | null;
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!hasPermission(me, permission)) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
