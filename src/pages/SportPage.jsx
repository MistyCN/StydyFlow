import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const RUNS_STORAGE_KEY = 'studyflow-runs'

function loadRuns() {
  try {
    const raw = localStorage.getItem(RUNS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function saveRuns(items) {
  localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(items))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function SportPage({ withFeedback }) {
  const [runs, setRuns] = useState(() => loadRuns())
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ date: today(), km: 5 })

  const addRun = () => {
    if (!draft.date || draft.km <= 0) return
    const next = [
      { id: crypto.randomUUID(), date: draft.date, km: draft.km },
      ...runs,
    ]
    setRuns(next)
    saveRuns(next)
    setDraft({ date: today(), km: 5 })
    setShowForm(false)
  }

  const deleteRun = (id) => {
    const next = runs.filter((r) => r.id !== id)
    setRuns(next)
    saveRuns(next)
  }

  const totalKm = runs.reduce((sum, r) => sum + r.km, 0)

  return (
    <section className="animate-fade-in flex min-h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{'跑步记录'}</p>
        <button
          type="button"
          onClick={() => withFeedback(() => setShowForm((v) => !v))}
          className="rounded-xl bg-[#008069] p-2 text-white shadow transition active:bg-[#25D366]"
          aria-label="Add run"
        >
          <Plus size={16} />
        </button>
      </div>

      {runs.length > 0 && (
        <div className="rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-md text-center">
          <p className="text-xs text-slate-500">{'累计里程'}</p>
          <p className="text-2xl font-bold text-[#008069]">{`${totalKm.toFixed(1)} km`}</p>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur space-y-3">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-[#F7F8FA] px-3 py-2 text-sm text-slate-800 outline-none"
          />
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-sm text-slate-600">{'里程'}</p>
              <p className="text-sm font-bold text-[#008069]">{`${draft.km} km`}</p>
            </div>
            <input
              type="range"
              min="0.5"
              max="42"
              step="0.5"
              value={draft.km}
              onChange={(e) => setDraft((d) => ({ ...d, km: parseFloat(e.target.value) }))}
              className="w-full accent-[#008069]"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>{'0.5'}</span>
              <span>{'42 km'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => withFeedback(addRun)}
            className="w-full rounded-xl bg-[#008069] py-2 text-sm font-medium text-white transition active:bg-[#25D366]"
          >
            {'记录'}
          </button>
        </div>
      )}

      {runs.length === 0 && !showForm && (
        <div className="rounded-2xl border border-white/60 bg-white/90 p-4 text-sm text-slate-500 shadow-lg">
          {'暂无跑步记录，点击右上角添加。'}
        </div>
      )}

      <div className="space-y-2">
        {runs.map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-md"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{run.date}</p>
              <p className="text-xs text-slate-500">{'跑步'}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-bold text-[#008069]">{`${run.km} km`}</p>
              <button
                type="button"
                onClick={() => withFeedback(() => deleteRun(run.id))}
                className="rounded-xl p-2 text-slate-400 transition active:bg-slate-200"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
