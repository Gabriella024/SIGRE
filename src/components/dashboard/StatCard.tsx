import { Minus, TrendingDown, type LucideIcon, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  accentColor: 'blue' | 'green' | 'orange' | 'red'
  trend: {
    direction: 'up' | 'down' | 'flat'
    label: string
  }
}

const colorStyles = {
  blue: {
    borderLeft: 'border-l-blue-500',
    iconBg: 'bg-blue-100/80 text-blue-600',
  },
  green: {
    borderLeft: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100/80 text-emerald-600',
  },
  orange: {
    borderLeft: 'border-l-amber-500',
    iconBg: 'bg-amber-100/80 text-amber-600',
  },
  red: {
    borderLeft: 'border-l-rose-500',
    iconBg: 'bg-rose-100/80 text-rose-600',
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accentColor,
  trend,
}: StatCardProps) {
  const styles = colorStyles[accentColor]

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-100 border-l-[5px] ${styles.borderLeft} flex flex-col justify-between transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.iconBg}`}>
          <Icon className="h-4 w-4 stroke-[2.2]" />
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium">
          {trend.direction === 'up' && (
            <>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
              <span className="text-emerald-600 font-semibold">{trend.label}</span>
            </>
          )}

          {trend.direction === 'down' && (
            <>
              <TrendingDown className="h-3.5 w-3.5 text-rose-500 stroke-[2.5]" />
              <span className="text-rose-500 font-semibold">{trend.label}</span>
            </>
          )}

          {trend.direction === 'flat' && (
            <>
              <Minus className="h-3.5 w-3.5 text-amber-500 stroke-[2.5]" />
              <span className="text-slate-500 font-normal">{trend.label}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}