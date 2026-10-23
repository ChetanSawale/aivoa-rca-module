import { useState } from 'react'
import { SEVERITIES } from '../types'
import type { Deviation } from '../types'

interface Props {
  onSubmit: (data: Partial<Deviation>) => Promise<void>
  onCancel: () => void
}

const empty = {
  title: '',
  batch_number: '',
  product_name: '',
  process_stage: '',
  date_occurred: new Date().toISOString().slice(0, 10),
  severity: 'Major',
  description: '',
  immediate_action: '',
  reported_by: '',
}

export default function DeviationForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSubmit(form as Partial<Deviation>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mb-6">
      <h2 className="mb-4 text-lg font-semibold">New Deviation</h2>
      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Title *</label>
          <input className="input" required value={form.title} onChange={set('title')}
            placeholder="e.g. Out-of-specification impurity result in hydrogenation batch" />
        </div>
        <div>
          <label className="label">Batch number *</label>
          <input className="input" required value={form.batch_number} onChange={set('batch_number')}
            placeholder="e.g. MTZ-HYD-2026-0147" />
        </div>
        <div>
          <label className="label">Product / API name *</label>
          <input className="input" required value={form.product_name} onChange={set('product_name')}
            placeholder="e.g. Metronidazole API" />
        </div>
        <div>
          <label className="label">Process stage *</label>
          <input className="input" required value={form.process_stage} onChange={set('process_stage')}
            placeholder="e.g. Hydrogenation (Step 3)" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date occurred *</label>
            <input className="input" type="date" required value={form.date_occurred} onChange={set('date_occurred')} />
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" value={form.severity} onChange={set('severity')}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="label">Description *</label>
          <textarea className="input" rows={4} required value={form.description} onChange={set('description')}
            placeholder="What happened, what was observed, which results were out of specification…" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Immediate action taken</label>
          <textarea className="input" rows={2} value={form.immediate_action} onChange={set('immediate_action')}
            placeholder="Containment steps taken right after detection (batch hold, QA notification…)" />
        </div>
        <div>
          <label className="label">Reported by *</label>
          <input className="input" required value={form.reported_by} onChange={set('reported_by')}
            placeholder="e.g. A. Deshmukh, QC Analyst" />
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Create deviation'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
