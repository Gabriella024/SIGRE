export const NOT_AVAILABLE = "No disponible";

export function textOrNotAvailable(value: string | null | undefined): string {
  return value?.trim() ? value : NOT_AVAILABLE;
}

export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("es-CO");
}

export function localDateKey(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-CA");
}

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(
  search: string,
  ...fields: Array<string | null | undefined>
): boolean {
  const needle = normalizeText(search);
  return needle === "" || fields.some((field) => normalizeText(field).includes(needle));
}

export function matchesOption(filter: string, value: string | null): boolean {
  return filter === "" || normalizeText(value) === normalizeText(filter);
}

export function formatStatusLabel(value: string): string {
  const text = value.replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function distinctOptions(
  values: Array<string | null>
): Array<{ value: string; label: string }> {
  const unique = new Map<string, string>();

  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !unique.has(normalizeText(trimmed))) {
      unique.set(normalizeText(trimmed), trimmed);
    }
  }

  return [...unique.values()]
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
    .map((value) => ({ value, label: formatStatusLabel(value) }));
}
