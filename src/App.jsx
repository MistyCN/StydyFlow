import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, Check, Clock3, Plus, Settings, Trash2 } from 'lucide-react'

const PLAN_STORAGE_KEY = 'studyflow-plans'
const LEGACY_MEMO_STORAGE_KEY = 'studyflow-memos'
const FOCUS_DURATION_SECONDS = 25 * 60

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function normalizePlan(item) {
  if (!item || typeof item !== 'object') {
    return null
  }

  if (typeof item.title === 'string') {
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      title: item.title,
      completed: Boolean(item.completed),
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
    }
  }

  if (typeof item.content === 'string') {
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      title: item.content,
      completed: false,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
    }
  }

  if (typeof item.text === 'string') {
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      title: item.text,
      completed: false,
      updatedAt: Date.now(),
    }
  }

  return null
}

function loadPlans() {
  try {
    const rawPlans = localStorage.getItem(PLAN_STORAGE_KEY)
    if (rawPlans) {
      const parsed = JSON.parse(rawPlans)
      if (Array.isArray(parsed)) {
        return parsed.map(normalizePlan).filter(Boolean)
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_MEMO_STORAGE_KEY)
    if (!legacyRaw) {
      return []
    }

    const legacyParsed = JSON.parse(legacyRaw)
    if (!Array.isArray(legacyParsed)) {
      return []
    }

    return legacyParsed.map(normalizePlan).filter(Boolean)
  } catch {
    return []
  }
}

function createPlan(title) {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    updatedAt: Date.now(),
  }
}

function formatPlanTime(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [activeTab, setActiveTab] = useState('focus')
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_DURATION_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [plans, setPlans] = useState(() => loadPlans())
  const [planDraft, setPlanDraft] = useState('')

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          setIsRunning(false)
          return FOCUS_DURATION_SECONDS
        }
        return previous - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [isRunning])

  useEffect(() => {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans))
  }, [plans])

  const progress = useMemo(
    () => (FOCUS_DURATION_SECONDS - remainingSeconds) / FOCUS_DURATION_SECONDS,
    [remainingSeconds],
  )

  const doneCount = useMemo(
    () => plans.filter((plan) => plan.completed).length,
    [plans],
  )

  const circleCircumference = 2 * Math.PI * 110
  const strokeOffset = circleCircumference * (1 - progress)

  const addPlan = () => {
    const trimmed = planDraft.trim()
    if (!trimmed) {
      return
    }

    setPlans((previous) => [createPlan(trimmed), ...previous])
    setPlanDraft('')
  }

  const togglePlan = (id) => {
    setPlans((previous) =>
      previous.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              completed: !plan.completed,
              updatedAt: Date.now(),
            }
          : plan,
      ),
    )
  }

  const deletePlan = (id) => {
    setPlans((previous) => previous.filter((plan) => plan.id !== id))
  }

  const navItems = [
    { id: 'focus', label: '\u4e13\u6ce8', icon: Clock3 },
    { id: 'plans', label: '\u8ba1\u5212', icon: BookOpenText },
    { id: 'settings', label: '\u8bbe\u7f6e', icon: Settings },
  ]

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F0F2F5] p-0 text-slate-800 sm:p-3">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#25D366]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-56 w-56 rounded-full bg-[#008069]/15 blur-3xl" />

      <div className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-[#F0F2F5] sm:h-[96svh] sm:w-auto sm:max-h-[900px] sm:aspect-[9/19.5] sm:rounded-[2rem] sm:border sm:border-white/70 sm:shadow-2xl">
        <header className="sticky top-0 z-20 rounded-b-3xl bg-gradient-to-r from-[#008069] to-[#0a8f75] px-5 py-5 text-white shadow-lg">
          <h1 className="text-xl font-bold tracking-wide">STUDYFLOW</h1>
        </header>

        <main className="relative flex-1 px-4 py-5 pb-32">
          {activeTab === 'focus' && (
            <section className="animate-fade-in flex h-full flex-col items-center justify-center gap-7">
              <div className="w-full rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur">
                <div className="mx-auto w-fit">
                  <div className="relative">
                    <svg className="h-64 w-64 -rotate-90" viewBox="0 0 240 240">
                      <circle
                        cx="120"
                        cy="120"
                        r="110"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="12"
                      />
                      <circle
                        cx="120"
                        cy="120"
                        r="110"
                        fill="none"
                        stroke="#008069"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-slate-800">
                      {formatTime(remainingSeconds)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setRemainingSeconds(FOCUS_DURATION_SECONDS)}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 shadow-sm transition active:bg-slate-200"
                  >
                    {'\u91cd\u7f6e'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRunning((previous) => !previous)}
                className="absolute bottom-35 right-5 rounded-2xl bg-[#008069] p-5 text-white shadow-xl transition active:bg-[#25D366]"
                aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              >
                <Clock3 size={24} />
              </button>
            </section>
          )}

          {activeTab === 'plans' && (
            <section className="animate-fade-in flex h-full flex-col gap-3">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{'\u4eca\u65e5\u8fdb\u5ea6'}</p>
                  <span className="rounded-full bg-[#25D366]/20 px-3 py-1 text-xs font-semibold text-[#006a57]">
                    {doneCount}/{plans.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={planDraft}
                    onChange={(event) => setPlanDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addPlan()
                      }
                    }}
                    className="h-11 flex-1 rounded-2xl border border-slate-200 bg-[#F7F8FA] px-4 text-sm text-slate-800 outline-none"
                    placeholder={'\u6dfb\u52a0\u65b0\u8ba1\u5212'}
                  />
                  <button
                    type="button"
                    onClick={addPlan}
                    className="rounded-2xl bg-[#008069] p-3 text-white shadow-md transition active:bg-[#25D366]"
                    aria-label="Add plan"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pb-2">
                {plans.length === 0 && (
                  <div className="rounded-2xl border border-white/60 bg-white/90 p-4 text-sm text-slate-500 shadow-lg">
                    {'\u6682\u65e0\u8ba1\u5212\uff0c\u4ece\u4e0a\u9762\u6dfb\u52a0\u4e00\u6761\u4efb\u52a1\u3002'}
                  </div>
                )}

                {plans.map((plan, index) => (
                  <article
                    key={plan.id}
                    className="animate-slide-up rounded-2xl border border-white/70 bg-white/95 p-3 shadow-md transition duration-200 hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => togglePlan(plan.id)}
                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition active:bg-slate-200 ${
                          plan.completed
                            ? 'border-[#008069] bg-[#008069] text-white'
                            : 'border-slate-300 bg-white text-transparent'
                        }`}
                        aria-label="Toggle plan"
                      >
                        <Check size={13} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`break-words text-sm ${
                            plan.completed
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800'
                          }`}
                        >
                          {plan.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {'\u66f4\u65b0\u4e8e '}
                          {formatPlanTime(plan.updatedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePlan(plan.id)}
                        className="rounded-xl p-2 text-slate-500 transition active:bg-slate-200"
                        aria-label="Delete plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="animate-fade-in space-y-3">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur">
                <h2 className="text-sm font-semibold text-slate-800">{'\u8bbe\u7f6e'}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {
                    '\u5f53\u524d\u7248\u672c\u4fdd\u6301 WhatsApp \u98ce\u683c\u4e3b\u9898\uff0c\u5df2\u5347\u7ea7\u4e3a\u66f4\u73b0\u4ee3\u7684\u5361\u7247\u5f0f\u5c42\u7ea7\u4e0e\u52a8\u6548\u3002'
                  }
                </p>
              </div>
            </section>
          )}
        </main>

        <nav className="absolute bottom-3 left-2 right-2 z-20 flex rounded-2xl border border-white/70 bg-white/90 p-1 shadow-xl backdrop-blur">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs transition active:bg-slate-200 ${
                  isActive
                    ? 'bg-[#25D366]/20 font-bold text-[#007a62]'
                    : 'text-slate-500'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default App
