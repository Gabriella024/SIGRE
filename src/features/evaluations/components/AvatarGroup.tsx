import type { EvaluadorAsignado } from '@/features/evaluations/types/resultado'

export function AvatarGroup({ evaluadores }: { evaluadores: EvaluadorAsignado[] }) {
  if (evaluadores.length === 0) return <span className="text-xs text-slate-400">Sin asignar</span>

  return (
    <div className="flex -space-x-2">
      {evaluadores.map((ev, i) => (
        <div
          key={i}
          title={`${ev.nombre ?? 'Evaluador'}${ev.calificado ? ' · calificó' : ' · pendiente'}`}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-semibold text-white ${ev.color} ${ev.calificado ? 'border-white' : 'border-amber-300 opacity-60'}`}
        >
          {ev.iniciales}
        </div>
      ))}
    </div>
  )
}
