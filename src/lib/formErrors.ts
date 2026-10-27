import type { z } from "zod";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function toFieldErrors<K extends string>(issues: readonly z.core.$ZodIssue[]): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "") as K;
    errors[key] ??= issue.message;
  }
  return errors;
}

export function nullableTrim(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
