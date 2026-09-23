import { useMemo, useState } from 'react'

import { DataTable } from '@/components/ui/data-table'
import { retosMock } from '@/features/challenges/mocks/ChallengesMocks'
import { retoColumns } from '@/features/challenges/columns'
import { ChallengesFilters } from '@/components/challenges/ChallengesFilters'

export function ChallengesPage() {
  const [activeTab, setActiveTab] = useState('metricas')

  const retosFiltrados = useMemo(() => {
    if (activeTab === 'metricas') return retosMock
    return retosMock.filter((r) => r.nivel === activeTab)
  }, [activeTab])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Listado de Retos</h1>
      </div>

      <ChallengesFilters activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'metricas' ? (
        <div className="rounded-lg border bg-white p-6 text-center text-slate-400 shadow-sm">
          Panel de métricas generales de R1, R2 y R3 (pendiente de diseño)
        </div>
      ) : (
        <DataTable columns={retoColumns} data={retosFiltrados} pageSize={8} />
      )}
    </div>
  )
}