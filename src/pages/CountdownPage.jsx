import { useState } from 'react'
import { Plus, Trash2, X, CalendarDays, Clock } from 'lucide-react'

const COUNTDOWN_STORAGE_KEY = 'studyflow-countdowns'

function loadCountdowns() {
  try {
    const raw = localStorage.getItem(COUNTDOWN_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function saveCountdowns(items) {
  localStorage.setItem(COUNTDOWN_STORAGE_KEY, JSON.stringify(items))
}

function getDaysLeft(dateStr) {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function CountdownModal({ item, onClose }) {
  const days = getDaysLeft(item.date)
  const target = new Date(item.date)
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const isToday = days === 0
  const isPast = days < 0
  const absDays = Math.abs(days)

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-white pb-8 pt-5 px-5 shadow-2xl"
        style={{ animation: 'slideUpModal 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {`${target.getFullYear()}年 ${monthNames[target.getMonth()]} ${target.getDate()}日 ${weekNames[target.getDay()]}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 active:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className={`rounded-2xl px-5 py-6 text-center mb-4 ${isPast ? 'bg-slate-100' : 'bg-gradient-to-br from-[#008069] to-[#0a8f75]'}`}>
          <p className={`text-7xl font-black tabular-nums ${isPast ? 'text-slate-400' : 'text-white'}`}>
            {absDays}
          </p>
          <p className={`mt-1 text-base font-medium ${isPast ? 'text-slate-400' : 'text-white/80'}`}>
            {isToday ? '就是今天' : isPast ? '天前已过' : '天后'}
          </p>
        </div>


        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <CalendarDays size={15} className="text-[#008069]" />
            <div>
              <p className="text-xs text-slate-400">{'日期'}</p>
              <p className="text-sm font-semibold text-slate-700">{item.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <Clock size={15} className="text-[#008069]" />
            <div>
              <p className="text-xs text-slate-400">{'星期'}</p>
              <p className="text-sm font-semibold text-slate-700">{weekNames[target.getDay()]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CountdownPage({ withFeedback }) {
  const [items, setItems] = useState(() => loadCountdowns())
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ title: '', date: '' })
  const [selectedItem, setSelectedItem] = useState(null)

  const addItem = () => {
    if (!draft.title.trim() || !draft.date) return
    const next = [
      ...items,
      { id: crypto.randomUUID(), title: draft.title.trim(), date: draft.date },
    ]
    setItems(next)
    saveCountdowns(next)
    setDraft({ title: '', date: '' })
    setShowForm(false)
  }

  const deleteItem = (id) => {
    const next = items.filter((i) => i.id !== id)
    setItems(next)
    saveCountdowns(next)
    if (selectedItem?.id === id) setSelectedItem(null)
  }

  return (
    <section className="animate-fade-in flex min-h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{'倒计日'}</p>
        <button
          type="button"
          onClick={() => withFeedback(() => setShowForm((v) => !v))}
          className="rounded-xl bg-[#008069] p-2 text-white shadow transition active:bg-[#25D366]"
          aria-label="Add countdown"
        >
          <Plus size={16} />
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur space-y-2">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder={'事件名称'}
            className="w-full rounded-xl border border-slate-200 bg-[#F7F8FA] px-3 py-2 text-sm text-slate-800 outline-none"
          />
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-[#F7F8FA] px-3 py-2 text-sm text-slate-800 outline-none"
          />
          <button
            type="button"
            onClick={() => withFeedback(addItem)}
            className="w-full rounded-xl bg-[#008069] py-2 text-sm font-medium text-white transition active:bg-[#25D366]"
          >
            {'添加'}
          </button>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border border-white/60 bg-white/90 p-4 text-sm text-slate-500 shadow-lg">
          {'暂无倒计日，点击右上角添加。'}
        </div>
      )}

      <div className="space-y-2">
        {[...items].sort((a, b) => new Date(a.date) - new Date(b.date)).map((item) => {
          const days = getDaysLeft(item.date)
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-md cursor-pointer"
              style={{ animation: 'fadeScaleIn 0.3s ease both' }}
              onClick={() => withFeedback(() => setSelectedItem(item))}
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-4xl font-bold text-[#008069] tabular-nums">
                    {Math.abs(days)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {days === 0 ? '今天' : days > 0 ? '天后' : '天前'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); withFeedback(() => deleteItem(item.id)) }}
                  className="rounded-xl p-2 text-slate-400 transition active:bg-slate-200"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedItem && (
        <CountdownModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </section>
  )
}
