import { NOT_AVAILABLE } from "@/lib/format";

export function NullableText({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  return value?.trim() ? (
    <span className={className}>{value}</span>
  ) : (
    <span className="text-xs italic text-slate-400">{NOT_AVAILABLE}</span>
  );
}
