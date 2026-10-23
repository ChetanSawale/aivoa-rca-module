import { useState } from 'react'
import { ISHIKAWA_CATEGORIES } from '../types'
import type { RootCause } from '../types'

interface Props {
  value: RootCause
  onSave: (value: RootCause) => Promise<void>
}

/** Editable view of the AI root cause analysis: Ishikawa categories + 5 Whys. */
export default function RootCauseEditor({ value, onSave }: Props) {
  const [draft, setDraft] = useState<RootCause>(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setCause = (cat: string, idx: number, text: string) =>
    setDraft((d) => ({
      ...d,
      ishikawa: {
        ...d.ishikawa,
        [cat]: d.ishikawa[cat].map((c, i) => (i === idx ? text : c)),
      },
    }))

  const addCause = (cat: string) =>
    setDraft((d) => ({ ...d, ishikawa: { ...d.ishikawa, [cat]: [...(d.ishikawa[cat] ?? []), ''] } }))

  const removeCause = (cat: string, idx: number) =>
    setDraft((d) => ({
      ...d,
      ishikawa: { ...d.ishikawa, [cat]: d.ishikawa[cat].filter((_, i) => i !== idx) },
    }))

  const setWhy = (idx: number, field: 'question' | 'answer', text: string) =>
    setDraft((d) => ({
      ...d,
      five_whys: d.five_whys.map((w, i) => (i === idx ? { ...w, [field]: text } : w)),
    }))

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
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ISHIKAWA_CATEGORIES.map((cat) => (
          <div key={cat} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <h4 className="mb-2 text-sm font-semibold text-slate-700">{cat}</h4>
            {(draft.ishikawa[cat] ?? []).map((cause, idx) => (
              <div key={idx} className="mb-2 flex gap-1">
                <input
                  className="input bg-white"
                  value={cause}
                  onChange={(e) => setCause(cat, idx, e.target.value)}
                />
                <button type="button" className="px-2 text-slate-400 hover:text-red-600"
                  onClick={() => removeCause(cat, idx)} title="Remove">×</button>
              </div>
            ))}
            <button type="button" className="text-xs font-medium text-brand-600 hover:underline"
              onClick={() => addCause(cat)}>+ Add cause</button>
          </div>
        ))}
      </div>

      <h4 className="mb-2 mt-6 text-sm font-semibold text-slate-700">5 Whys</h4>
      <div className="space-y-2">
        {draft.five_whys.map((w, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 md:flex-row md:items-center">
            <span className="w-16 shrink-0 rounded bg-violet-100 px-2 py-1 text-center text-xs font-bold text-violet-700">
              WHY {w.level}
            </span>
            <input className="input md:w-2/5" value={w.question}
              onChange={(e) => setWhy(idx, 'question', e.target.value)} placeholder="Why…?" />
            <input className="input flex-1" value={w.answer}
              onChange={(e) => setWhy(idx, 'answer', e.target.value)} placeholder="Because…" />
          </div>
        ))}
      </div>

      <h4 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Root cause statement</h4>
      <textarea className="input" rows={3} value={draft.root_cause_statement}
        onChange={(e) => setDraft((d) => ({ ...d, root_cause_statement: e.target.value }))} />

      <button type="button" className="btn-primary mt-4" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save root cause analysis'}
      </button>
    </div>
  )
}
