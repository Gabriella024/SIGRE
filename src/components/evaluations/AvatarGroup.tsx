
import type { EvaluadorAsignado } from '@/features/evaluations/types/resultado'
export function AvatarGroup({ evaluadores }: { evaluadores: EvaluadorAsignado[] }) {
  return (
    <div className="flex -space-x-2">
      {evaluadores.map((ev, i) => (
        <div
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-white ${ev.color}`}
        >
          {ev.iniciales}
        </div>
      ))}
    </div>
  )
}