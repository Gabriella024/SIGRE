import { useMemo, useState } from 'react'
import { ChallengesTable } from '@/features/challenges/components/ChallengesTable'
import { MOCK_CHALLENGES } from '@/features/challenges/mocks/ChallengesMocks'
import { ChallengesFilters } from '@/features/challenges/components/ChallengesFilters'
import type { Challenge } from '@/features/challenges/types/Challenge'
import { ViewToggle, type ViewMode } from '@/components/ui/viewToggle'
import SessionCalendar from '@/features/calendar/components/SessionCalendar'

export function ChallengesPage() {
  const [activeTab, setActiveTab] = useState('R1')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const retosFiltrados = useMemo(() => {
    return MOCK_CHALLENGES.filter((r) => r.nivel === activeTab)
  }, [activeTab])

  const handleEdit = (challenge: Challenge) => {
    console.log("Editar reto:", challenge.codigo)
  }

  const handleDelete = (challenge: Challenge) => {
    console.log("Eliminar reto:", challenge.codigo)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Retos</h1>
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === 'list' ? (
        <>
          <ChallengesFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showAddButton={true}
          />
          <ChallengesTable
            data={retosFiltrados}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
          <SessionCalendar module="orientaciones" readOnly={true} />
        </div>
      )}
    </div>
  )
}