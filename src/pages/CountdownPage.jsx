import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, X, CalendarDays, Clock } from 'lucide-react'

const COUNTDOWN_STORAGE_KEY = 'studyflow-countdowns'

function loadCountdowns() {
  try {
    const raw = localStorage.getItem(COUNTDOWN_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { }
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
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const isToday = days === 0
  const isPast = days < 0
  const absDays = Math.abs(days)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card relative h-fit w-full rounded-t-[32px] px-0 pb-safe-bottom pt-3 shadow-2xl animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#c7c7cc]" />

        <div className="flex items-center justify-between px-5 py-2">
          <h3 className="text-ink truncate pr-4 text-[20px] font-bold tracking-tight">{item.title}</h3>
          <button type="button" onClick={onClose} className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-[rgba(60,60,67,0.18)] text-[#8e8e93] active:opacity-50 transition-opacity">
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className={`mb-4 rounded-3xl p-8 text-center shadow-sm ${isPast ? 'glass-soft' : 'liquid-primary'}`}>
            <p className={`text-[80px] font-bold tabular-nums leading-none tracking-tighter ${isPast ? 'text-ink-subtle' : 'text-white'}`}>
              {absDays}
            </p>
            <p className={`mt-2 text-[15px] font-medium ${isPast ? 'text-ink-subtle' : 'text-white/80'}`}>
              {isToday ? '就是今天' : isPast ? '天前已过' : '天后'}
            </p>
          </div>

          <div className="ios-list-group shadow-sm">
            <div className="ios-list-row min-h-[44px]">
              <div className="flex items-center gap-3">
                <CalendarDays size={20} className="text-[#007aff]" strokeWidth={2.5} />
                <span className="text-ink text-[17px]">日期</span>
              </div>
              <span className="text-ink-subtle pr-1 text-[17px]">
                {`${target.getFullYear()}年${monthNames[target.getMonth()]}${target.getDate()}日`}
              </span>
            </div>
            <div className="ios-list-row min-h-[44px]">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-[#007aff]" strokeWidth={2.5} />
                <span className="text-ink text-[17px]">星期</span>
              </div>
              <span className="text-ink-subtle pr-1 text-[17px]">{weekNames[target.getDay()]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
    <section className="animate-fade-in flex min-h-full flex-col gap-4 pt-2">
      <div className="flex items-end justify-between px-1">
        <span className="text-ink text-[20px] font-bold tracking-tight">倒数日</span>
        <button
          type="button"
          onClick={() => withFeedback(() => setShowForm((v) => !v))}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-[rgba(0,122,255,0.1)] text-[#007aff] transition-colors active:bg-[rgba(0,122,255,0.2)]"
          aria-label="Add countdown"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-4 animate-spring-in">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="事件名称"
              className="glass-soft text-ink h-10 w-full rounded-xl px-4 text-[17px] placeholder:text-[#5d7292] outline-none"
            />
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="glass-soft text-ink h-10 w-full rounded-xl px-4 text-[17px] outline-none"
            />
            <button
              type="button"
              onClick={() => withFeedback(addItem)}
              className="liquid-primary liquid-ripple mt-1 h-[44px] w-full rounded-xl text-[17px] font-semibold transition-opacity active:opacity-70"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="ios-list-group p-6 text-center shadow-sm">
          <p className="text-ink-subtle text-[15px]">暂无记录，点击右上角添加。</p>
        </div>
      )}

      <div className="flex flex-col gap-3 pb-4">
        {[...items].sort((a, b) => new Date(a.date) - new Date(b.date)).map((item) => {
          const days = getDaysLeft(item.date)
          const isPast = days < 0
          return (
            <div
              key={item.id}
              className="glass-card p-4 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
              onClick={() => withFeedback(() => setSelectedItem(item))}
            >
              <div className="flex flex-col pr-4">
                <p className="text-ink mb-1 text-[17px] font-semibold leading-tight tracking-tight">{item.title}</p>
                <p className="text-ink-subtle text-[13px] font-medium">{item.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end justify-center">
                  <p className={`text-[28px] font-bold tabular-nums leading-none tracking-tight ${isPast ? 'text-ink-subtle' : 'text-[#2d78dc]'}`}>
                    {Math.abs(days)}
                  </p>
                  <p className="text-ink-subtle mt-1 text-[11px] font-medium">
                    {days === 0 ? '今天' : days > 0 ? '天后' : '已过'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); withFeedback(() => deleteItem(item.id)) }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,59,48,0.1)] text-[#ff3b30] transition-opacity active:opacity-50 flex-shrink-0"
                  aria-label="Delete"
                >
                  <Trash2 size={16} strokeWidth={2} />
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
