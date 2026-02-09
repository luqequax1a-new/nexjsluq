import type { ApiError } from "@/lib/api";

type LaravelValidationDetails = {
  message?: unknown;
  errors?: Record<string, unknown>;
};

export function getAuthErrorMessage(error: unknown, fallback: string) {
  const err = error as ApiError;
  const details = err?.details as LaravelValidationDetails | undefined;
  const errors = details?.errors;

  if (errors && typeof errors === "object") {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  }

  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return fallback;
}
