import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'



export type FilterOption = {
  value: string
  label: string
}

export type FilterConfig = {
  key: string
  label: string
  value: string
  placeholder?: string
  options?: FilterOption[]
  type?: 'select' | 'date' | 'datetime'
  onChange: (value: string) => void
}

type FiltersBarProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters: FilterConfig[]
  onClearFilters: () => void
  actions?: ReactNode
}

const selectClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-lime-500'

const dateInputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 [color-scheme:light] focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-500/20 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:hue-rotate-[100deg]'

const isFilterActive = (filter: FilterConfig) => filter.value.trim() !== ''

export function FiltersBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  onClearFilters,
  actions,
}: FiltersBarProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeCount = filters.filter(isFilterActive).length

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-lg border-slate-200 bg-slate-50 pl-9"
        />
      </div>

      <div className="flex items-center gap-3">
        {filters.length > 0 && (
          <div ref={containerRef} className="relative">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-500 px-1.5 text-xs font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </Button>

            {open && (
              <div
                role="dialog"
                className="absolute right-0 top-full z-20 mt-2 w-64 space-y-3 rounded-xl border bg-white p-4 shadow-lg"
              >
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-1">
                    <label htmlFor={`filter-${filter.key}`} className="text-xs font-medium text-slate-500">
                      {filter.label}
                    </label>
                    {filter.type === 'date' || filter.type === 'datetime' ? (
                      <input
                        id={`filter-${filter.key}`}
                        type={filter.type === 'date' ? 'date' : 'datetime-local'}
                        className={dateInputClass}
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                      />
                    ) : (
                      <select
                        id={`filter-${filter.key}`}
                        className={selectClass}
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                      >
                        <option value="">{filter.placeholder ?? 'Todos'}</option>
                        {(filter.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                <Button
                  variant="ghost"
                  className="w-full text-slate-600"
                  onClick={onClearFilters}
                  disabled={activeCount === 0}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {actions}
      </div>
    </div>
  )
}
