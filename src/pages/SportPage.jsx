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
  } catch { }
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
    <section className="animate-fade-in flex min-h-full flex-col gap-4 pt-2">
      <div className="flex items-end justify-between px-1">
        <span className="text-[20px] font-bold text-[#1c1c1e] tracking-tight">跑步记录</span>
        <button
          type="button"
          onClick={() => withFeedback(() => setShowForm((v) => !v))}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-[rgba(0,122,255,0.1)] text-[#007aff] transition-colors active:bg-[rgba(0,122,255,0.2)]"
          aria-label="Add run"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {runs.length > 0 && (
        <div className="ios-list-group shadow-sm p-5 text-center flex flex-col items-center">
          <p className="text-[13px] font-semibold text-[#8e8e93] tracking-widest uppercase mb-1">总里程</p>
          <p className="text-[52px] font-bold tabular-nums text-[#007aff] leading-none tracking-tight">
            {totalKm.toFixed(1)} <span className="text-[20px] font-medium text-[#8e8e93]">km</span>
          </p>
        </div>
      )}

      {showForm && (
        <div className="glass-card p-4 animate-spring-in space-y-4">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            className="h-10 w-full rounded-xl bg-[rgba(118,118,128,0.12)] px-4 text-[17px] text-[#1c1c1e] outline-none"
          />
          <div className="ios-list-group p-4 shadow-none border-none bg-[rgba(118,118,128,0.06)]">
            <div className="flex justify-between items-baseline mb-3">
              <p className="text-[15px] font-semibold text-[#1c1c1e]">单次里程</p>
              <p className="text-[28px] font-bold tabular-nums text-[#007aff]">{draft.km} <span className="text-[15px]">km</span></p>
            </div>
            <input
              type="range"
              min="0.5"
              max="42"
              step="0.5"
              value={draft.km}
              onChange={(e) => setDraft((d) => ({ ...d, km: parseFloat(e.target.value) }))}
              className="w-full accent-[#007aff]"
            />
            <div className="flex justify-between text-[11px] text-[#8e8e93] font-medium mt-1 px-1">
              <span>0.5k</span>
              <span>42k</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => withFeedback(addRun)}
            className="h-[44px] w-full rounded-xl bg-[#007aff] text-[17px] font-semibold text-white transition-opacity active:opacity-70"
          >
            完成保存
          </button>
        </div>
      )}

      {runs.length === 0 && !showForm && (
        <div className="ios-list-group p-6 text-center shadow-sm">
          <p className="text-[15px] text-[#8e8e93]">暂无记录，点击右上角开始记录。</p>
        </div>
      )}

      {/* iOS Activity List */}
      <div className="ios-list-group shadow-sm mb-6">
        {runs.map((run) => (
          <div key={run.id} className="ios-list-row">
            <div className="flex items-center gap-3 w-10">
              <div className="h-2 w-2 rounded-full bg-[#007aff]" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[19px] font-semibold text-[#1c1c1e] leading-snug">{run.km} km</p>
              <p className="text-[13px] text-[#8e8e93] font-medium mt-0.5">{run.date}</p>
            </div>
            <button
              type="button"
              onClick={() => withFeedback(() => deleteRun(run.id))}
              className="p-2 text-[#ff3b30] active:opacity-50 transition-opacity"
              aria-label="Delete"
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
