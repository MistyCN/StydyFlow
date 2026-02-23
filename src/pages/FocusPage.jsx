import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { History } from 'lucide-react'
import { formatTime } from '../utils'

const WHEEL_ITEM_HEIGHT = 40
const WHEEL_PADDING_ROWS = 2
const LONG_PRESS_MS = 500

function formatDurationHMS(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDateKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function formatMinuteTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatHoursMinutes(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${minutes}min`
}

function WheelColumn({ label, value, options, onChange, withFeedback }) {
  const containerRef = useRef(null)
  const scrollTimerRef = useRef(null)
  const lastVibrationIndexRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return
    const valueIndex = Math.max(0, options.indexOf(value))
    lastVibrationIndexRef.current = valueIndex
    containerRef.current.scrollTop = valueIndex * WHEEL_ITEM_HEIGHT
  }, [value, options])

  const snapToNearest = () => {
    const node = containerRef.current
    if (!node) return
    const nextIndex = Math.max(0, Math.min(options.length - 1, Math.round(node.scrollTop / WHEEL_ITEM_HEIGHT)))
    const nextValue = options[nextIndex]
    node.scrollTo({ top: nextIndex * WHEEL_ITEM_HEIGHT, behavior: 'smooth' })
    onChange(nextValue)
  }

  return (
    <div className="relative flex-1">
      <p className="text-ink-subtle mb-2 text-center text-[13px] font-medium">{label}</p>
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[200px] overflow-y-auto no-scrollbar rounded-2xl bg-[rgba(118,118,128,0.08)]"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
          onScroll={() => {
            const node = containerRef.current
            if (!node) return
            const nextIndex = Math.max(0, Math.min(options.length - 1, Math.round(node.scrollTop / WHEEL_ITEM_HEIGHT)))
            if (nextIndex !== lastVibrationIndexRef.current) {
              lastVibrationIndexRef.current = nextIndex
              withFeedback(() => { })
            }
            if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
            scrollTimerRef.current = window.setTimeout(snapToNearest, 80)
          }}
        >
          <div style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_PADDING_ROWS }} />
          {options.map((item) => (
            <button
              key={item}
              type="button"
              className={`h-10 w-full text-center text-[20px] tabular-nums transition-colors ${item === value ? 'text-ink font-semibold' : 'text-ink-subtle'}`}
              onClick={() => withFeedback(() => onChange(item))}
            >
              {String(item).padStart(2, '0')}
            </button>
          ))}
          <div style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_PADDING_ROWS }} />
        </div>
        <div className="pointer-events-none absolute left-2 right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl border border-white/40 bg-white/30" />
      </div>
    </div>
  )
}

function TimeWheelPicker({ valueSeconds, onChange, withFeedback }) {
  const hours = Math.floor(valueSeconds / 3600)
  const minutes = Math.floor((valueSeconds % 3600) / 60)
  const seconds = valueSeconds % 60
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])
  const minuteSecondOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => i), [])

  const updateValue = (nextHours, nextMinutes, nextSeconds) => {
    const total = nextHours * 3600 + nextMinutes * 60 + nextSeconds
    onChange(Math.max(1, total))
  }

  return (
    <div className="ios-list-group shadow-sm w-full max-w-[360px] p-4">
      <p className="text-ink mb-3 text-center text-[16px] font-medium">自定义时长</p>
      <div className="flex gap-3">
        <WheelColumn label="时" value={hours} options={hourOptions} onChange={(h) => updateValue(h, minutes, seconds)} withFeedback={withFeedback} />
        <WheelColumn label="分" value={minutes} options={minuteSecondOptions} onChange={(m) => updateValue(hours, m, seconds)} withFeedback={withFeedback} />
        <WheelColumn label="秒" value={seconds} options={minuteSecondOptions} onChange={(s) => updateValue(hours, minutes, s)} withFeedback={withFeedback} />
      </div>
    </div>
  )
}

function CustomDurationModal({ valueSeconds, onChange, onClose, withFeedback }) {
  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full h-fit rounded-t-[28px] border-t border-white/45 px-4 pb-safe-bottom pt-3 shadow-2xl animate-sheet-up" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#c7c7cc]" />
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-ink text-[17px] font-semibold">设置自定义时长</p>
          <button type="button" onClick={onClose} className="liquid-primary liquid-ripple h-8 rounded-lg px-3 text-[14px] font-semibold active:opacity-80">完成</button>
        </div>
        <TimeWheelPicker valueSeconds={valueSeconds} onChange={onChange} withFeedback={withFeedback} />
      </div>
    </div>,
    document.body,
  )
}

function HistoryModal({ sessions, onClose, onDeleteEntry, onSaveNote, withFeedback }) {
  const longPressTimerRef = useRef(null)
  const hasLongPressedRef = useRef(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [showStats, setShowStats] = useState(false)

  const dailyStats = useMemo(() => {
    const map = {}
    sessions.forEach((item) => {
      const day = formatDateKey(item.startAt)
      map[day] = (map[day] ?? 0) + item.durationSeconds
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).map(([date, seconds]) => ({ date, seconds }))
  }, [sessions])

  const startLongPress = (entry) => {
    hasLongPressedRef.current = false
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => {
      hasLongPressedRef.current = true
      withFeedback(() => setSelectedEntry(entry))
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    if (!longPressTimerRef.current) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="glass-card relative h-fit w-full rounded-t-[32px] px-0 pb-safe-bottom pt-3 shadow-2xl animate-sheet-up" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#c7c7cc]" />
        <div className="flex items-center justify-between px-5 py-2">
          <h3 className="text-ink text-[20px] font-bold tracking-tight">工作时长历史</h3>
          <button
            type="button"
            onClick={() => withFeedback(() => setShowStats((v) => !v))}
            className="liquid-ripple rounded-md bg-[rgba(34,197,195,0.18)] px-3 py-1.5 text-[15px] font-semibold text-[#0f766e] active:bg-[rgba(34,197,195,0.3)]"
          >
            每日
          </button>
        </div>

        <div className="px-5 pb-8 pt-2">
          {!showStats && sessions.length === 0 && <div className="ios-list-group p-6 text-center shadow-sm"><p className="text-ink-subtle text-[15px]">暂无历史记录</p></div>}
          {showStats && dailyStats.length === 0 && <div className="ios-list-group p-6 text-center shadow-sm"><p className="text-ink-subtle text-[15px]">暂无统计数据</p></div>}

          {showStats && dailyStats.length > 0 && (
            <div className="ios-list-group shadow-sm">
              {dailyStats.map((row) => (
                <div key={row.date} className="ios-list-row min-h-[52px]">
                  <span className="text-[17px] text-[#1c1c1e]">{row.date}</span>
                  <span className="text-[17px] font-semibold text-[#007aff]">{formatHoursMinutes(row.seconds)}</span>
                </div>
              ))}
            </div>
          )}

          {!showStats && sessions.length > 0 && (
            <>
              <p className="mb-2 px-2 text-[12px] text-[#8e8e93]">长按条目可删除或备注</p>
              <div className="ios-list-group shadow-sm">
                {sessions.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="ios-list-row min-h-[64px] w-full text-left"
                    onMouseDown={() => startLongPress(entry)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => startLongPress(entry)}
                    onTouchEnd={cancelLongPress}
                    onTouchCancel={cancelLongPress}
                    onClick={() => { if (hasLongPressedRef.current) hasLongPressedRef.current = false }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[15px] font-semibold text-[#1c1c1e]">{formatDateKey(entry.startAt)} {formatMinuteTime(entry.startAt)} - {formatMinuteTime(entry.endAt)}</span>
                      {entry.note && <span className="text-[12px] text-[#8e8e93] mt-0.5 line-clamp-1">{entry.note}</span>}
                    </div>
                    <span className="text-[16px] font-semibold tabular-nums text-[#007aff]">{formatTime(entry.durationSeconds)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 px-4 pb-6 animate-fade-in" onClick={() => setSelectedEntry(null)}>
          <div className="ios-list-group w-full max-w-[360px] overflow-hidden rounded-2xl shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="ios-list-row liquid-ripple w-full text-[17px] text-[#2d78dc] active:bg-white/20" onClick={() => withFeedback(() => { setNoteDraft(selectedEntry.note ?? ''); setShowNoteEditor(true) })}>编辑备注</button>
            <button type="button" className="ios-list-row liquid-ripple w-full text-[17px] text-[#ff3b30] active:bg-white/20" onClick={() => withFeedback(() => { onDeleteEntry(selectedEntry.id); setSelectedEntry(null) })}>删除记录</button>
            <button type="button" className="ios-list-row liquid-ripple w-full text-[17px] text-[#5f7595] active:bg-white/20" onClick={() => setSelectedEntry(null)}>取消</button>
          </div>
        </div>
      )}

      {showNoteEditor && selectedEntry && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 animate-fade-in" onClick={() => setShowNoteEditor(false)}>
          <div className="glass-card w-full max-w-[360px] rounded-2xl border border-white/45 p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="text-ink mb-3 text-[17px] font-semibold">备注 {formatDateKey(selectedEntry.startAt)}</p>
            <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="输入备注" rows={4} className="glass-soft text-ink w-full resize-none rounded-xl px-3 py-2 text-[15px] outline-none" />
            <div className="mt-3 flex gap-2">
              <button type="button" className="liquid-outline h-10 flex-1 rounded-xl text-[15px] font-medium" onClick={() => setShowNoteEditor(false)}>取消</button>
              <button type="button" className="liquid-primary liquid-ripple h-10 flex-1 rounded-xl text-[15px] font-semibold" onClick={() => withFeedback(() => { onSaveNote(selectedEntry.id, noteDraft); setShowNoteEditor(false); setSelectedEntry(null) })}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

export default function FocusPage({
  needsPermissionGuide,
  withFeedback,
  setActiveMainTab,
  refreshExactAlarmStatus,
  refreshNotificationStatus,
  circleCircumference,
  strokeOffset,
  remainingSeconds,
  currentModeDurationSeconds,
  cancelTimerNotification,
  setIsRunning,
  setTimerEndAt,
  setRemainingSeconds,
  isRunning,
  isPaused,
  setIsPaused,
  setCurrentSessionStartedAt,
  setCurrentSessionDurationSeconds,
  scheduleTimerNotification,
  activeTimerMode,
  setActiveTimerMode,
  customDurationSeconds,
  setCustomDurationSeconds,
  customCountsAsWork,
  setCustomCountsAsWork,
  getModeDuration,
  workHistory,
  updateWorkHistoryNote,
  deleteWorkHistoryEntry,
  radius = 110,
  strokeWidth = 14,
}) {
  const [showHistory, setShowHistory] = useState(false)
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const sessions = useMemo(() => [...workHistory].sort((a, b) => b.endAt - a.endAt), [workHistory])
  const modeItems = [{ id: 'work', label: '工作' }, { id: 'rest', label: '休息' }, { id: 'custom', label: '自定义' }]
  const activeModeIndex = Math.max(0, modeItems.findIndex((item) => item.id === activeTimerMode))

  const modeStatusText = isRunning
    ? activeTimerMode === 'work'
      ? '工作中'
      : activeTimerMode === 'rest'
        ? '休息中'
        : '自定义计时中'
    : isPaused
      ? '已暂停'
      : '准备开始'

  return (
    <section
      className="animate-fade-in relative flex min-h-full flex-col items-center justify-center gap-6 pt-2 transition-all duration-300"
    >
      {needsPermissionGuide && (
        <div className="w-full rounded-[14px] bg-[rgba(255,59,48,0.1)] px-4 py-3 text-left backdrop-blur-md">
          <p className="text-[13px] font-semibold text-[#ff3b30]">开启通知权限</p>
          <p className="mt-1 text-[12px] leading-tight text-[#ff3b30]/80">请确认已开启弹窗/横幅通知，否则退到后台可能收不到提醒。</p>
          <button type="button" onClick={() => withFeedback(() => { setActiveMainTab('settings'); void refreshExactAlarmStatus(); void refreshNotificationStatus() })} className="mt-2 rounded-lg bg-white/60 px-3 py-1.5 text-[12px] font-semibold text-[#ff3b30] transition active:bg-white/40 shadow-sm">去设置</button>
        </div>
      )}

      <div
        className="relative mt-3 w-full max-w-[320px] rounded-[10px] bg-[rgba(120,120,128,0.16)] p-[2px] transition-all duration-300"
      >
        <div
          className="absolute left-[2px] top-[2px] h-[30px] rounded-[8px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out"
          style={{
            width: 'calc((100% - 4px) / 3)',
            transform: `translateX(calc(${activeModeIndex} * 100%))`,
          }}
        />
        <div className="relative z-10 flex">
          {modeItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex-1 rounded-[8px] px-2 py-[5px] text-[13px] font-medium transition-colors duration-200 ${activeTimerMode === item.id ? 'text-[#1c1c1e]' : 'text-[#3a3a3c]'
                }`}
              onClick={() => withFeedback(() => {
                setIsRunning(false)
                setIsPaused(false)
                setCurrentSessionStartedAt(null)
                setCurrentSessionDurationSeconds(0)
                setTimerEndAt(null)
                setShowCustomPicker(false)
                void cancelTimerNotification()
                setActiveTimerMode(item.id)
                setRemainingSeconds(getModeDuration(item.id))
              })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`w-full max-w-[360px] overflow-hidden transition-all duration-300 ease-out ${activeTimerMode === 'custom'
          ? 'max-h-[180px] opacity-100 mt-2'
          : 'max-h-0 opacity-0 mt-0'
          }`}
      >
        <div className="w-full flex flex-col items-center gap-4">
          <button type="button" onClick={() => withFeedback(() => setShowCustomPicker(true))} className="liquid-outline liquid-ripple h-10 rounded-full px-4 text-[14px] font-semibold text-[#2d78dc]">
            自定义时长: {formatDurationHMS(customDurationSeconds)}
          </button>
          <div className="ios-list-group w-full shadow-sm px-4 py-2">
            <label className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#1c1c1e]">计入工作时长</span>
                <span className="text-[12px] text-[#8e8e93]">开启后自定义计时会进入工时统计</span>
              </div>
              <div className="ios-toggle">
                <input type="checkbox" checked={customCountsAsWork} onChange={(event) => withFeedback(() => setCustomCountsAsWork(event.target.checked))} />
                <span className="ios-toggle-track"></span>
                <span className="ios-toggle-thumb"></span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="w-full relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg className="h-72 w-72 -rotate-90 transform-gpu" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r={radius} fill="none" stroke="var(--ios-gray6)" strokeWidth={strokeWidth} />
            <circle cx="120" cy="120" r={radius} fill="none" stroke="var(--ios-blue)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circleCircumference} strokeDashoffset={strokeOffset} className="transition-all duration-1000 ease-linear" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-ink mb-1 text-[64px] font-bold leading-none tabular-nums tracking-tight">{formatTime(remainingSeconds)}</span>
            <span className="text-ink-subtle text-[15px] font-medium">{modeStatusText}</span>
          </div>
        </div>

        <div className="mt-8 flex justify-center w-full max-w-[200px]">
          <button
            type="button"
            onClick={() => withFeedback(() => {
              if (isRunning) {
                setIsRunning(false)
                setIsPaused(true)
                setTimerEndAt(null)
                void cancelTimerNotification()
                return
              }
              if (!isPaused) {
                setCurrentSessionStartedAt(Date.now())
                setCurrentSessionDurationSeconds(remainingSeconds)
              }
              setTimerEndAt(Date.now() + remainingSeconds * 1000)
              setIsRunning(true)
              setIsPaused(false)
              void scheduleTimerNotification(remainingSeconds, activeTimerMode)
            })}
            className={`w-full rounded-full py-[14px] text-[17px] font-semibold transition-all active:scale-95 ${isRunning ? 'liquid-outline text-[#ff3b30]' : 'liquid-primary liquid-ripple'}`}
          >
            {isRunning ? '暂停' : isPaused ? '继续' : '开始'}
          </button>
        </div>

        {isPaused && (
          <button
            type="button"
            onClick={() => withFeedback(() => {
              setIsPaused(false)
              setIsRunning(false)
              setCurrentSessionStartedAt(null)
              setCurrentSessionDurationSeconds(0)
              setTimerEndAt(null)
              setRemainingSeconds(currentModeDurationSeconds)
              void cancelTimerNotification()
            })}
            className="mt-3 text-[15px] text-[#ff3b30] active:opacity-70 font-medium transition-opacity"
          >
            终止计时
          </button>
        )}

        {!isRunning && !isPaused && remainingSeconds < currentModeDurationSeconds && (
          <button
            type="button"
            onClick={() => withFeedback(() => {
              setIsRunning(false)
              setTimerEndAt(null)
              setRemainingSeconds(currentModeDurationSeconds)
              void cancelTimerNotification()
            })}
            className="text-ink-subtle mt-4 text-[15px] font-medium transition-colors active:text-[#304968]"
          >
            重置计时
          </button>
        )}

        <button type="button" onClick={() => withFeedback(() => setShowHistory(true))} className="liquid-outline liquid-ripple mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium text-[#2d78dc] transition">
          <History size={15} />
          历史记录
        </button>
      </div>

      {showCustomPicker && activeTimerMode === 'custom' && (
        <CustomDurationModal
          valueSeconds={customDurationSeconds}
          onClose={() => setShowCustomPicker(false)}
          withFeedback={withFeedback}
          onChange={(nextSeconds) => {
            setCustomDurationSeconds(nextSeconds)
            if (!isRunning && activeTimerMode === 'custom') setRemainingSeconds(nextSeconds)
          }}
        />
      )}

      {showHistory && (
        <HistoryModal
          sessions={sessions}
          onClose={() => setShowHistory(false)}
          onDeleteEntry={deleteWorkHistoryEntry}
          onSaveNote={updateWorkHistoryNote}
          withFeedback={withFeedback}
        />
      )}
    </section>
  )
}
