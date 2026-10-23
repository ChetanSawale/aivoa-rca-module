import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import DeviationDetail from './components/DeviationDetail'
import DeviationForm from './components/DeviationForm'
import { STATUSES } from './types'
import type { Deviation } from './types'

const severityStyle: Record<string, string> = {
  Minor: 'bg-emerald-100 text-emerald-800',
  Major: 'bg-amber-100 text-amber-800',
  Critical: 'bg-red-100 text-red-800',
}

const statusStyle: Record<string, string> = {
  Open: 'bg-sky-100 text-sky-800',
  'Under Investigation': 'bg-violet-100 text-violet-800',
  'CAPA Proposed': 'bg-orange-100 text-orange-800',
  Closed: 'bg-slate-200 text-slate-700',
}

export default function App() {
  const [deviations, setDeviations] = useState<Deviation[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.listDeviations()
      setDeviations(data)
      setSelectedId((prev) => prev ?? (data.length ? data[0].id : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the backend. Is it running on port 8000?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = deviations.find((d) => d.id === selectedId) ?? null

  const handleCreate = async (data: Partial<Deviation>) => {
    const created = await api.createDeviation(data)
    setDeviations((list) => [created, ...list])
    setSelectedId(created.id)
    setShowForm(false)
  }

  const handleUpdate = (updated: Deviation) =>
    setDeviations((list) => list.map((d) => (d.id === updated.id ? updated : d)))

  const handleDelete = async (id: number) => {
    await api.deleteDeviation(id)
    setDeviations((list) => {
      const next = list.filter((d) => d.id !== id)
      if (selectedId === id) setSelectedId(next.length ? next[0].id : null)
      return next
    })
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">AIVOA — AI Root Cause Analysis</h1>
          <p className="text-sm text-slate-500">
            Deviation → Evidence → AI Root Cause Analysis → CAPA · Pharmaceutical API manufacturing
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close form' : '+ New deviation'}
        </button>
      </header>

      {/* workflow strip */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        {['1 · Deviation intake', '2 · Evidence review', '3 · AI root cause analysis', '4 · CAPA recommendations'].map(
          (step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">{step}</span>
              {i < arr.length - 1 && <span className="text-slate-300">→</span>}
            </span>
          ),
        )}
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {showForm && <DeviationForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* -------- list -------- */}
        <aside className="space-y-3">
          {loading && <p className="text-sm text-slate-500">Loading deviations…</p>}
          {!loading && deviations.length === 0 && (
            <p className="text-sm text-slate-500">No deviations yet. Create the first one.</p>
          )}
          {deviations.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`card block w-full text-left transition ${
                d.id === selectedId ? 'ring-2 ring-brand-500' : 'hover:shadow'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug">{d.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${severityStyle[d.severity]}`}>
                  {d.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {d.batch_number} · {d.product_name}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle[d.status]}`}>
                  {d.status}
                </span>
                <span className="text-[11px] text-slate-400">
                  {d.evidence.length} evidence · {d.date_occurred}
                </span>
              </div>
            </button>
          ))}
          <p className="pt-1 text-center text-[11px] text-slate-400">
            Status flow: {STATUSES.join(' → ')}
          </p>
        </aside>

        {/* -------- detail -------- */}
        <main>
          {selected ? (
            <DeviationDetail
              key={selected.id}
              deviation={selected}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ) : (
            !loading && (
              <div className="card text-sm text-slate-500">
                Select a deviation from the list, or create a new one to start an investigation.
              </div>
            )
          )}
        </main>
      </div>
    </div>
  )
}
