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
        className="w-full h-fit bg-[#f2f2f7]/90 backdrop-blur-xl rounded-t-[32px] pt-3 pb-safe-bottom px-0 shadow-2xl relative animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#c7c7cc]" />

        <div className="flex items-center justify-between px-5 py-2">
          <h3 className="text-[20px] font-bold text-[#1c1c1e] tracking-tight truncate pr-4">{item.title}</h3>
          <button type="button" onClick={onClose} className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-[rgba(60,60,67,0.18)] text-[#8e8e93] active:opacity-50 transition-opacity">
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className={`rounded-3xl p-8 text-center mb-4 shadow-sm ${isPast ? 'bg-[#e5e5ea]' : 'bg-[#007aff]'}`}>
            <p className={`text-[80px] font-bold tabular-nums leading-none tracking-tighter ${isPast ? 'text-[#8e8e93]' : 'text-white'}`}>
              {absDays}
            </p>
            <p className={`mt-2 text-[15px] font-medium ${isPast ? 'text-[#8e8e93]' : 'text-white/80'}`}>
              {isToday ? '就是今天' : isPast ? '天前已过' : '天后'}
            </p>
          </div>

          <div className="ios-list-group shadow-sm">
            <div className="ios-list-row min-h-[44px]">
              <div className="flex items-center gap-3">
                <CalendarDays size={20} className="text-[#007aff]" strokeWidth={2.5} />
                <span className="text-[17px] text-[#1c1c1e]">日期</span>
              </div>
              <span className="text-[17px] text-[#8e8e93] pr-1">
                {`${target.getFullYear()}年${monthNames[target.getMonth()]}${target.getDate()}日`}
              </span>
            </div>
            <div className="ios-list-row min-h-[44px]">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-[#007aff]" strokeWidth={2.5} />
                <span className="text-[17px] text-[#1c1c1e]">星期</span>
              </div>
              <span className="text-[17px] text-[#8e8e93] pr-1">{weekNames[target.getDay()]}</span>
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
        <span className="text-[20px] font-bold text-[#1c1c1e] tracking-tight">倒计时</span>
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
              className="h-10 w-full rounded-xl bg-[rgba(118,118,128,0.12)] px-4 text-[17px] text-[#1c1c1e] placeholder-[#3c3c43]/60 outline-none"
            />
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="h-10 w-full rounded-xl bg-[rgba(118,118,128,0.12)] px-4 text-[17px] text-[#1c1c1e] outline-none"
            />
            <button
              type="button"
              onClick={() => withFeedback(addItem)}
              className="mt-1 h-[44px] w-full rounded-xl bg-[#007aff] text-[17px] font-semibold text-white transition-opacity active:opacity-70"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="ios-list-group p-6 text-center shadow-sm">
          <p className="text-[15px] text-[#8e8e93]">暂无记录，点击右上角添加。</p>
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
                <p className="text-[17px] font-semibold text-[#1c1c1e] mb-1 leading-tight tracking-tight">{item.title}</p>
                <p className="text-[13px] text-[#8e8e93] font-medium">{item.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end justify-center">
                  <p className={`text-[28px] font-bold tabular-nums leading-none tracking-tight ${isPast ? 'text-[#8e8e93]' : 'text-[#007aff]'}`}>
                    {Math.abs(days)}
                  </p>
                  <p className="text-[11px] text-[#8e8e93] font-medium mt-1">
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
