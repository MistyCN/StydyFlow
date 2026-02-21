import { useEffect, useMemo, useState } from 'react'
import { registerPlugin } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { BookOpenText, Check, Clock3, Plus, Settings, Trash2 } from 'lucide-react'

const PLAN_STORAGE_KEY = 'studyflow-plans'
const LEGACY_MEMO_STORAGE_KEY = 'studyflow-memos'
const SETTINGS_STORAGE_KEY = 'studyflow-settings'
const FOCUS_DURATION_SECONDS = 25 * 60
const DEBUG_FOCUS_DURATION_SECONDS = 5
const TIMER_NOTIFICATION_ID = 1001
const TIMER_CHANNEL_ID = 'studyflow-alerts'
const SettingsBridge = registerPlugin('SettingsBridge')

function loadSettings() {
  const defaults = {
    vibrationEnabled: true,
    developerMode: false,
    shortTimerEnabled: false,
  }

  try {
    const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!rawSettings) {
      return defaults
    }

    const parsed = JSON.parse(rawSettings)
    const legacyDebugMode = typeof parsed.debugMode === 'boolean' ? parsed.debugMode : null
    return {
      vibrationEnabled:
        typeof parsed.vibrationEnabled === 'boolean'
          ? parsed.vibrationEnabled
          : defaults.vibrationEnabled,
      developerMode:
        typeof parsed.developerMode === 'boolean'
          ? parsed.developerMode
          : legacyDebugMode ?? defaults.developerMode,
      shortTimerEnabled:
        typeof parsed.shortTimerEnabled === 'boolean'
          ? parsed.shortTimerEnabled
          : legacyDebugMode ?? defaults.shortTimerEnabled,
    }
  } catch {
    return defaults
  }
}

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
  const [isRunning, setIsRunning] = useState(false)
  const [plans, setPlans] = useState(() => loadPlans())
  const [planDraft, setPlanDraft] = useState('')
  const [settings, setSettings] = useState(() => loadSettings())
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [exactAlarmGranted, setExactAlarmGranted] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [notificationError, setNotificationError] = useState('')
  const [timerEndAt, setTimerEndAt] = useState(null)
  const needsPermissionGuide = !notificationEnabled || (settings.developerMode && !exactAlarmGranted)

  const focusDurationSeconds = settings.shortTimerEnabled
    ? DEBUG_FOCUS_DURATION_SECONDS
    : FOCUS_DURATION_SECONDS
  const [remainingSeconds, setRemainingSeconds] = useState(focusDurationSeconds)

  const cancelTimerNotification = async () => {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: TIMER_NOTIFICATION_ID }],
      })
      await refreshNotificationStatus()
    } catch {
      // Ignore unsupported platforms.
    }
  }

  const refreshNotificationStatus = async () => {
    try {
      const enabled = await LocalNotifications.areEnabled()
      setNotificationEnabled(enabled.value)

      const pending = await LocalNotifications.getPending()
      setPendingCount(pending.notifications.length)
      setNotificationError('')
    } catch (error) {
      setNotificationError(String(error))
    }
  }

  const createTimerChannel = async () => {
    try {
      await LocalNotifications.createChannel({
        id: TIMER_CHANNEL_ID,
        name: 'StudyFlow Alerts',
        description: 'StudyFlow timer notifications',
        importance: 5,
        visibility: 1,
        vibration: true,
      })
    } catch {
      // Ignore unsupported platforms.
    }
  }

  const openSystemNotificationSettings = async () => {
    try {
      const enabled = await LocalNotifications.areEnabled()
      if (!enabled.value) {
        await SettingsBridge.openAppNotificationSettings()
        setNotificationError('')
        return
      }

      await SettingsBridge.openNotificationChannelSettings({ channelId: TIMER_CHANNEL_ID })
      setNotificationError('')
    } catch {
      try {
        await SettingsBridge.openAppNotificationSettings()
        setNotificationError('')
      } catch (fallbackError) {
        try {
          await SettingsBridge.openAppDetailsSettings()
          setNotificationError('')
        } catch (finalError) {
          setNotificationError(
            `\u6253\u5f00\u901a\u77e5\u8bbe\u7f6e\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u8fdb\u5165\u7cfb\u7edf\u8bbe\u7f6e -> \u5e94\u7528 -> StudyFlow\u3002\u9519\u8bef: ${String(
              finalError ?? fallbackError,
            )}`,
          )
        }
      }
    }
  }

  const ensureNotificationPermission = async () => {
    try {
      const permission = await LocalNotifications.checkPermissions()
      if (permission.display === 'granted') {
        return true
      }

      const requested = await LocalNotifications.requestPermissions()
      return requested.display === 'granted'
    } catch {
      return false
    }
  }

  const refreshExactAlarmStatus = async () => {
    try {
      const setting = await LocalNotifications.checkExactNotificationSetting()
      setExactAlarmGranted(setting.exact_alarm === 'granted')
    } catch {
      setExactAlarmGranted(true)
    }
  }

  const scheduleTimerNotification = async (seconds) => {
    if (seconds <= 0) {
      return
    }

    try {
      const hasPermission = await ensureNotificationPermission()
      if (!hasPermission) {
        return
      }
      await createTimerChannel()

      try {
        const setting = await LocalNotifications.checkExactNotificationSetting()
        setExactAlarmGranted(setting.exact_alarm === 'granted')
      } catch {
        setExactAlarmGranted(true)
      }

      await LocalNotifications.cancel({
        notifications: [{ id: TIMER_NOTIFICATION_ID }],
      })
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TIMER_NOTIFICATION_ID,
            title: '\u5012\u8ba1\u65f6\u7ed3\u675f',
            body: '\u4e13\u6ce8\u65f6\u95f4\u5df2\u5b8c\u6210\uff0c\u53ef\u4ee5\u4f11\u606f\u4e00\u4e0b\u3002',
            channelId: TIMER_CHANNEL_ID,
            schedule: {
              at: new Date(Date.now() + seconds * 1000),
              // Avoid Android's idle throttling during short debug tests.
              allowWhileIdle: false,
            },
          },
        ],
      })
      await refreshNotificationStatus()
    } catch (error) {
      // Keep this visible for device debugging.
      console.error('Failed to schedule local notification', error)
      setNotificationError(String(error))
    }
  }

  const triggerVibration = () => {
    if (!settings.vibrationEnabled) {
      return
    }

    try {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(20)
        }
      })
    } catch {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(20)
      }
    }
  }

  const withFeedback = (action) => {
    try {
      triggerVibration()
    } finally {
      action()
    }
  }

  useEffect(() => {
    if (!isRunning || timerEndAt === null) {
      return undefined
    }

    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000))
      if (nextRemaining <= 0) {
        setIsRunning(false)
        setTimerEndAt(null)
        setShowFinishModal(true)
        setRemainingSeconds(focusDurationSeconds)
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          void LocalNotifications.cancel({
            notifications: [{ id: TIMER_NOTIFICATION_ID }],
          }).catch(() => {})
        }
        return
      }
      setRemainingSeconds(nextRemaining)
    }

    tick()
    const timerId = window.setInterval(tick, 1000)

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', tick)
    }

    return () => {
      window.clearInterval(timerId)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', tick)
      }
    }
  }, [isRunning, timerEndAt, focusDurationSeconds])

  useEffect(() => {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans))
  }, [plans])

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const progress = useMemo(
    () => (focusDurationSeconds - remainingSeconds) / focusDurationSeconds,
    [focusDurationSeconds, remainingSeconds],
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

        <main className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-32">
          {activeTab === 'focus' && (
            <section className="animate-fade-in flex min-h-full flex-col items-center justify-center gap-7">
              {needsPermissionGuide && (
                <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                  <p className="text-sm font-semibold text-amber-800">{'\u9700\u8981\u5f00\u542f\u901a\u77e5\u6743\u9650'}</p>
                  <p className="mt-1 text-xs text-amber-700">
                    {'\u8bf7\u53bb\u8bbe\u7f6e\u9875\u5f00\u542f\u901a\u77e5\u901a\u9053\u4e0e\u5f39\u7a97/\u61ac\u6d6e\uff0c\u5426\u5219\u9000\u5230\u540e\u53f0\u53ef\u80fd\u4e0d\u5f39\u7a97\u3002'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      withFeedback(() => {
                        setActiveTab('settings')
                        void refreshExactAlarmStatus()
                        void refreshNotificationStatus()
                      })
                    }
                    className="mt-2 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition active:bg-amber-100"
                  >
                    {'\u524d\u5f80\u8bbe\u7f6e\u9875'}
                  </button>
                </div>
              )}

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
                    onClick={() =>
                      withFeedback(() => {
                        setIsRunning(false)
                        setTimerEndAt(null)
                        setRemainingSeconds(focusDurationSeconds)
                        void cancelTimerNotification()
                      })
                    }
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 shadow-sm transition active:bg-slate-200"
                  >
                    {'\u91cd\u7f6e'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  withFeedback(() => {
                    if (isRunning) {
                      setIsRunning(false)
                      setTimerEndAt(null)
                      void cancelTimerNotification()
                      return
                    }

                    setTimerEndAt(Date.now() + remainingSeconds * 1000)
                    setIsRunning(true)
                    void scheduleTimerNotification(remainingSeconds)
                  })
                }
                className="absolute bottom-35 right-5 rounded-2xl bg-[#008069] p-5 text-white shadow-xl transition active:bg-[#25D366]"
                aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              >
                <Clock3 size={24} />
              </button>
            </section>
          )}

          {activeTab === 'plans' && (
            <section className="animate-fade-in flex min-h-full flex-col gap-3">
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
                    onClick={() => withFeedback(addPlan)}
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
                        onClick={() => withFeedback(() => togglePlan(plan.id))}
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
                        onClick={() => withFeedback(() => deletePlan(plan.id))}
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
                <div className="mt-3 space-y-3 text-left">
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{'\u6309\u952e\u9707\u52a8\u53cd\u9988'}</p>
                      <p className="text-xs text-slate-500">{'\u70b9\u51fb\u6309\u94ae\u65f6\u89e6\u53d1\u8f7b\u5fae\u9707\u52a8'}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.vibrationEnabled}
                      onChange={(event) => {
                        setSettings((previous) => ({
                          ...previous,
                          vibrationEnabled: event.target.checked,
                        }))
                      }}
                      className="h-5 w-5 accent-[#008069]"
                    />
                  </label>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">{'\u540e\u53f0\u5230\u70b9\u901a\u77e5'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {notificationEnabled
                        ? '\u8bf7\u786e\u4fdd StudyFlow Alerts \u901a\u9053\u5df2\u5f00\u542f\u5f39\u7a97/\u61ac\u6d6e/\u6a2a\u5e45'
                        : '\u7cfb\u7edf\u4e2d\u6b64 App \u901a\u77e5\u603b\u5f00\u5173\u5df2\u5173\u95ed\uff0c\u8bf7\u5148\u5f00\u542f'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        withFeedback(() => {
                          void openSystemNotificationSettings()
                        })
                      }}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition active:bg-slate-200"
                    >
                      {'\u6253\u5f00StudyFlow Alerts\u901a\u9053\u8bbe\u7f6e'}
                    </button>

                    {notificationError && (
                      <p className="mt-2 text-xs text-red-600">{`\u9519\u8bef: ${notificationError}`}</p>
                    )}

                    <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold text-slate-700">{'\u6388\u6743\u6307\u5f15\uff08\u7b80\u5316\uff09'}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        {`1. \u70b9\u300c\u6253\u5f00StudyFlow Alerts\u901a\u9053\u8bbe\u7f6e\u300d -> \u6253\u5f00\u300c\u5f39\u7a97/\u61ac\u6d6e/\u6a2a\u5e45\u300d`}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{`2. \u901a\u77e5\u603b\u5f00\u5173\u672a\u5f00\u65f6\uff0c\u8bf7\u5148\u5728\u7cfb\u7edf\u5c42\u6253\u5f00 App \u901a\u77e5`}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur">
                <h2 className="text-sm font-semibold text-slate-800">{'\u5f00\u53d1\u8005\u6a21\u5f0f'}</h2>
                <div className="mt-3 space-y-3 text-left">
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {'\u5f00\u542f\u5f00\u53d1\u8005\u529f\u80fd'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {'\u663e\u793a\u300c\u53d1\u9001\u6d4b\u8bd5\u901a\u77e5/\u5f00\u542f\u7cbe\u786e\u63d0\u9192\u300d\u7b49\u9ad8\u7ea7\u64cd\u4f5c'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.developerMode}
                      onChange={(event) => {
                        const enabled = event.target.checked
                        withFeedback(() => {
                          setIsRunning(false)
                          void cancelTimerNotification()
                          setRemainingSeconds(FOCUS_DURATION_SECONDS)
                          setSettings((previous) => ({
                            ...previous,
                            developerMode: enabled,
                            shortTimerEnabled: enabled ? previous.shortTimerEnabled : false,
                          }))
                        })
                      }}
                      className="h-5 w-5 accent-[#008069]"
                    />
                  </label>

                  {settings.developerMode && (
                    <>
                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {'5\u79d2\u5012\u8ba1\u65f6\uff08\u53ef\u9009\uff09'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {'\u5f00\u542f\u540e\u4e13\u6ce8\u5012\u8ba1\u65f6\u4e3a 00:05\uff0c\u7528\u4e8e\u5feb\u901f\u9a8c\u8bc1'}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.shortTimerEnabled}
                          onChange={(event) => {
                            const enabled = event.target.checked
                            withFeedback(() => {
                              setIsRunning(false)
                              void cancelTimerNotification()
                              setRemainingSeconds(
                                enabled ? DEBUG_FOCUS_DURATION_SECONDS : FOCUS_DURATION_SECONDS,
                              )
                              setSettings((previous) => ({
                                ...previous,
                                shortTimerEnabled: enabled,
                              }))
                            })
                          }}
                          className="h-5 w-5 accent-[#008069]"
                        />
                      </label>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{'\u5f00\u53d1\u8005\u8c03\u8bd5'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {exactAlarmGranted
                            ? '\u7cbe\u786e\u63d0\u9192\u5df2\u5f00\u542f'
                            : '\u7cbe\u786e\u63d0\u9192\u672a\u5f00\u542f\uff0c\u77ed\u65f6\u901a\u77e5\u53ef\u80fd\u5ef6\u8fdf\u6216\u5931\u6548'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {`\u5f53\u524d\u5f85\u89e6\u53d1\u901a\u77e5: ${pendingCount}`}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              withFeedback(() => {
                                void scheduleTimerNotification(3)
                              })
                            }}
                            className="rounded-xl bg-[#008069] px-3 py-2 text-xs font-medium text-white transition active:bg-[#25D366]"
                          >
                            {'\u53d1\u90013\u79d2\u6d4b\u8bd5\u901a\u77e5'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              withFeedback(() => {
                                void LocalNotifications.changeExactNotificationSetting().finally(() => {
                                  void refreshExactAlarmStatus()
                                  void refreshNotificationStatus()
                                })
                              })
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition active:bg-slate-200"
                          >
                            {'\u5f00\u542f\u7cbe\u786e\u63d0\u9192'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            withFeedback(() => {
                              void refreshNotificationStatus()
                              void refreshExactAlarmStatus()
                            })
                          }}
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition active:bg-slate-200"
                        >
                          {'\u5237\u65b0\u8c03\u8bd5\u72b6\u6001'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                onClick={() =>
                  withFeedback(() => {
                    setActiveTab(item.id)
                    if (item.id === 'settings') {
                      void refreshExactAlarmStatus()
                      void refreshNotificationStatus()
                    }
                  })
                }
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

        {showFinishModal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-800">{'\u5012\u8ba1\u65f6\u7ed3\u675f'}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {'\u4e13\u6ce8\u65f6\u95f4\u5df2\u5b8c\u6210\uff0c\u53ef\u4ee5\u4f11\u606f\u4e00\u4e0b\u3002'}
              </p>
              <button
                type="button"
                onClick={() =>
                  withFeedback(() => {
                    setShowFinishModal(false)
                  })
                }
                className="mt-4 w-full rounded-2xl bg-[#008069] px-4 py-2.5 text-sm font-medium text-white transition active:bg-[#25D366]"
              >
                {'\u6211\u77e5\u9053\u4e86'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
