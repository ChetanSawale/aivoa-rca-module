import { useState } from 'react'
import type { Capa, CapaAction } from '../types'

interface Props {
  value: Capa
  onSave: (value: Capa) => Promise<void>
}

function ActionList({
  title,
  actions,
  onChange,
}: {
  title: string
  actions: CapaAction[]
  onChange: (actions: CapaAction[]) => void
}) {
  const set = (idx: number, field: keyof CapaAction, val: string) =>
    onChange(actions.map((a, i) => (i === idx ? { ...a, [field]: field === 'due_in_days' ? Number(val) : val } : a)))

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-700">{title}</h4>
      <div className="space-y-2">
        {actions.map((a, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 md:flex-row">
            <input className="input flex-1" value={a.action} placeholder="Action"
              onChange={(e) => set(idx, 'action', e.target.value)} />
            <input className="input md:w-48" value={a.owner_role} placeholder="Owner role"
              onChange={(e) => set(idx, 'owner_role', e.target.value)} />
            <div className="flex items-center gap-1">
              <input className="input w-20" type="number" min={1} value={a.due_in_days}
                onChange={(e) => set(idx, 'due_in_days', e.target.value)} />
              <span className="text-xs text-slate-500">days</span>
              <button type="button" className="px-1 text-slate-400 hover:text-red-600"
                onClick={() => onChange(actions.filter((_, i) => i !== idx))} title="Remove">×</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mt-2 text-xs font-medium text-brand-600 hover:underline"
        onClick={() => onChange([...actions, { action: '', owner_role: '', due_in_days: 30 }])}>
        + Add action
      </button>
    </div>
  )
}

/** Editable view of the AI CAPA recommendations. */
export default function CapaEditor({ value, onSave }: Props) {
  const [draft, setDraft] = useState<Capa>(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await onSave(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <ActionList title="Corrective actions" actions={draft.corrective_actions}
        onChange={(actions) => setDraft((d) => ({ ...d, corrective_actions: actions }))} />
      <ActionList title="Preventive actions" actions={draft.preventive_actions}
        onChange={(actions) => setDraft((d) => ({ ...d, preventive_actions: actions }))} />
      <button type="button" className="btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save CAPA plan'}
      </button>
    </div>
  )
}
