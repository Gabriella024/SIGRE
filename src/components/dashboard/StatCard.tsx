import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from '@/lib/utils'

type StatCardProps = {
  title: string
  value: number | string
  icon: LucideIcon
  accentColor: 'blue' | 'green' | 'orange' | 'red'
  trend?: { direction: 'up' | 'down' | 'flat'; label: string }
}

const accentMap = {
  blue: 'border-1-blue-500 text-blue-500 bg-blue-50',
  green: 'border-1-green-500 text-green-500 bg-green-50',
  orange: 'border-1-orange-500 text-orange-500 bg-orang-50',
  red: 'border-1-red-500 text-red-500 bg-red-50',
}

export function StatCard({ title, value, icon: Icon, accentColor, trend }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border-l-4 bg-white p-4 shadow-sm', accentMap[accentColor])}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={cn('rounded-md p-1.5', accentMap[accentColor])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3x1 font-bold text-slate-900">{value}</p>
      {trend && (
        <p className={cn(
          'mt-1 flex items-center gap-1 text-xs font-medium',
          trend.direction === 'up' && 'text-green-600',
          trend.direction === 'down' && 'text-red-500',
          trend.direction === 'flat' && 'text-slate-400'
        )}>
          {trend.direction === 'up' && <ArrowUp className="h-3 w-3" />}
          {trend.direction === 'down' && <ArrowDown className="h-3 w-3" />}
          {trend.direction === 'flat' && <Minus className="h-3 w-3" />}
          {trend.label}
        </p>
      )}

    </div>
  )
}