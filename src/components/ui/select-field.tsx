import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: readonly SelectOption[];
  placeholder?: string;
}

export function SelectField({ options, placeholder, className, ...props }: SelectFieldProps) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-60",
        className
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  return message ? <p className="text-xs text-rose-600">{message}</p> : null;
}
