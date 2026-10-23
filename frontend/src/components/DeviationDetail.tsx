import { useState } from 'react'
import { api } from '../api'
import { EVIDENCE_TYPES, STATUSES } from '../types'
import type { Capa, Deviation, EvidenceType, RootCause, Status } from '../types'
import CapaEditor from './CapaEditor'
import RootCauseEditor from './RootCauseEditor'

interface Props {
  deviation: Deviation
  onUpdate: (deviation: Deviation) => void
  onDelete: (id: number) => void
}

const severityStyle: Record<string, string> = {
  Minor: 'bg-emerald-100 text-emerald-800',
  Major: 'bg-amber-100 text-amber-800',
  Critical: 'bg-red-100 text-red-800',
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export default function DeviationDetail({ deviation: dev, onUpdate, onDelete }: Props) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null)
  const [evForm, setEvForm] = useState({ type: 'observation' as EvidenceType, title: '', details: '' })

  const rootCause = parseJson<RootCause>(dev.ai_root_cause)
  const capa = parseJson<Capa>(dev.ai_capa)

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy('')
    }
  }

  const changeStatus = (status: Status) =>
    run('status', async () => onUpdate(await api.updateDeviation(dev.id, { status })))

  const addEvidence = (e: React.FormEvent) => {
    e.preventDefault()
    void run('evidence', async () => {
      await api.addEvidence(dev.id, evForm)
      setEvForm({ type: 'observation', title: '', details: '' })
      // Refresh from server so the new evidence carries its real id
      const fresh = await api.listDeviations()
      const updated = fresh.find((d) => d.id === dev.id)
      if (updated) onUpdate(updated)
    })
  }

  const removeEvidence = (evidenceId: number) =>
    run('evidence', async () => {
      await api.deleteEvidence(evidenceId)
      onUpdate({ ...dev, evidence: dev.evidence.filter((ev) => ev.id !== evidenceId) })
    })

  const genSummary = () =>
    run('summary', async () => {
      const { summary } = await api.aiSummary(dev.id)
      setSummaryDraft(summary)
      onUpdate({ ...dev, ai_summary: summary })
    })

  const genRootCause = () =>
    run('rootcause', async () => {
      await api.aiRootCause(dev.id)
      const fresh = await api.listDeviations()
      const updated = fresh.find((d) => d.id === dev.id)
      if (updated) onUpdate(updated)
    })

  const genCapa = () =>
    run('capa', async () => {
      await api.aiCapa(dev.id)
      const fresh = await api.listDeviations()
      const updated = fresh.find((d) => d.id === dev.id)
      if (updated) onUpdate(updated)
    })

  const saveSummary = () =>
    run('summary-save', async () => {
      const text = summaryDraft ?? dev.ai_summary ?? ''
      onUpdate(await api.updateDeviation(dev.id, { ai_summary: text }))
      setSummaryDraft(null)
    })

  return (
    <div className="space-y-6">
      {/* ---------------- header ---------------- */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{dev.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Batch <span className="font-medium text-slate-700">{dev.batch_number}</span> ·{' '}
              {dev.product_name} · {dev.process_stage}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${severityStyle[dev.severity]}`}>
            {dev.severity}
          </span>
        </div>

        {/* status flow */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {STATUSES.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <button
                onClick={() => changeStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  dev.status === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
              {i < STATUSES.length - 1 && <span className="text-slate-300">→</span>}
            </span>
          ))}
          <button className="ml-auto text-xs font-medium text-red-500 hover:underline"
            onClick={() => { if (confirm('Delete this deviation and all its evidence?')) onDelete(dev.id) }}>
            Delete deviation
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="label">Date occurred</dt>
            <dd>{dev.date_occurred}</dd>
          </div>
          <div>
            <dt className="label">Reported by</dt>
            <dd>{dev.reported_by}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="label">Description</dt>
            <dd className="whitespace-pre-wrap">{dev.description}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="label">Immediate action taken</dt>
            <dd className="whitespace-pre-wrap">{dev.immediate_action || '—'}</dd>
          </div>
        </dl>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* ---------------- evidence ---------------- */}
      <div className="card">
        <h3 className="mb-3 text-base font-semibold">Evidence ({dev.evidence.length})</h3>
        {dev.evidence.length === 0 && (
          <p className="text-sm text-slate-500">No evidence recorded yet. Add investigation findings below — the AI uses them in its analysis.</p>
        )}
        <ul className="space-y-3">
          {dev.evidence.map((ev) => (
            <li key={ev.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">
                  <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                    {ev.type.replace('_', ' ')}
                  </span>
                  {ev.title}
                </p>
                <button className="text-slate-400 hover:text-red-600" title="Remove evidence"
                  onClick={() => removeEvidence(ev.id)}>×</button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{ev.details}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={addEvidence} className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-4">
          <select className="input" value={evForm.type}
            onChange={(e) => setEvForm((f) => ({ ...f, type: e.target.value as EvidenceType }))}>
            {EVIDENCE_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <input className="input md:col-span-3" required placeholder="Evidence title"
            value={evForm.title} onChange={(e) => setEvForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea className="input md:col-span-4" rows={2} placeholder="Details — measurements, values, observations…"
            value={evForm.details} onChange={(e) => setEvForm((f) => ({ ...f, details: e.target.value }))} />
          <div>
            <button type="submit" className="btn-secondary" disabled={busy === 'evidence'}>
              {busy === 'evidence' ? 'Adding…' : 'Add evidence'}
            </button>
          </div>
        </form>
      </div>

      {/* ---------------- AI: summary ---------------- */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">✦ AI Deviation Summary</h3>
          <button className="btn-ai" onClick={genSummary} disabled={busy === 'summary'}>
            {busy === 'summary' ? 'Generating…' : dev.ai_summary ? 'Regenerate' : 'Generate summary'}
          </button>
        </div>
        {(summaryDraft ?? dev.ai_summary) ? (
          <>
            <textarea className="input" rows={6} value={summaryDraft ?? dev.ai_summary ?? ''}
              onChange={(e) => setSummaryDraft(e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">AI-generated — review and edit before saving.</p>
            <button className="btn-primary mt-2" onClick={saveSummary} disabled={busy === 'summary-save'}>
              {busy === 'summary-save' ? 'Saving…' : 'Save summary'}
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-500">No summary yet. Generate one from the deviation and its evidence.</p>
        )}
      </div>

      {/* ---------------- AI: root cause ---------------- */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">✦ AI Root Cause Analysis (Ishikawa + 5 Whys)</h3>
          <button className="btn-ai" onClick={genRootCause} disabled={busy === 'rootcause'}>
            {busy === 'rootcause' ? 'Analysing…' : rootCause ? 'Regenerate analysis' : 'Generate root cause analysis'}
          </button>
        </div>
        {rootCause ? (
          <RootCauseEditor
            key={dev.ai_root_cause}
            value={rootCause}
            onSave={async (value) => {
              onUpdate(await api.updateDeviation(dev.id, { ai_root_cause: JSON.stringify(value) }))
            }}
          />
        ) : (
          <p className="text-sm text-slate-500">
            No analysis yet. The AI will organise candidate causes into the six Ishikawa categories and build a 5 Whys chain.
          </p>
        )}
      </div>

      {/* ---------------- AI: CAPA ---------------- */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">✦ AI CAPA Recommendations</h3>
          <button className="btn-ai" onClick={genCapa} disabled={busy === 'capa'}>
            {busy === 'capa' ? 'Generating…' : capa ? 'Regenerate CAPA' : 'Generate CAPA'}
          </button>
        </div>
        {capa ? (
          <CapaEditor
            key={dev.ai_capa}
            value={capa}
            onSave={async (value) => {
              onUpdate(await api.updateDeviation(dev.id, { ai_capa: JSON.stringify(value) }))
            }}
          />
        ) : (
          <p className="text-sm text-slate-500">
            No CAPA plan yet. Generate corrective and preventive actions with owner roles and due dates — ideally after the root cause analysis.
          </p>
        )}
      </div>
    </div>
  )
}
