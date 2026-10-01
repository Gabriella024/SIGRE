import { useMemo, useState } from 'react'

import { ChallengesTable } from '@/components/challenges/ChallengesTable'
import { MOCK_CHALLENGES } from '@/features/challenges/mocks/ChallengesMocks'
import { ChallengesFilters } from '@/components/challenges/ChallengesFilters'
import type { Challenge } from '@/features/challenges/types/Challenge'

export function ChallengesPage() {
  const [activeTab, setActiveTab] = useState('metricas')

  const retosFiltrados = useMemo(() => {
    if (activeTab === 'metricas') return MOCK_CHALLENGES
    return MOCK_CHALLENGES.filter((r) => r.nivel === activeTab)
  }, [activeTab])

  const handleEdit = (challenge: Challenge) => {
    console.log("Editar proyecto:", challenge.codigo);
  };

  const handleDelete = (challenge: Challenge) => {
    console.log("Eliminar proyecto:", challenge.codigo);
  };

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
        <ChallengesTable
          data={retosFiltrados}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}