import { useEffect, useMemo, useState } from 'react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Activity, BookOpenText, CalendarDays, Clock3, Settings, Sparkles } from 'lucide-react'

import {
  FOCUS_DURATION_SECONDS,
  TIMER_NOTIFICATION_ID,
  TIMER_CHANNEL_ID,
  SETTINGS_STORAGE_KEY,
  PLAN_STORAGE_KEY,
  SettingsBridge,
} from './constants'
import { loadSettings, loadPlans, createPlan } from './utils'
import FocusPage from './pages/FocusPage'
import PlansPage from './pages/PlansPage'
import SettingsPage from './pages/SettingsPage'
import CountdownPage from './pages/CountdownPage'
import InterestPage from './pages/InterestPage'
import SportPage from './pages/SportPage'

const WORK_HISTORY_STORAGE_KEY = 'studyflow-work-history'
const REST_DURATION_SECONDS = 5 * 60
const DEFAULT_CUSTOM_DURATION_SECONDS = 15 * 60

function getTimerCompletionCopy(mode) {
  if (mode === 'rest') {
    return {
      title: '\u4f11\u606f\u7ed3\u675f',
      body: '\u4f11\u606f\u65f6\u95f4\u5230\u4e86\uff0c\u53ef\u4ee5\u5f00\u59cb\u4e0b\u4e00\u8f6e\u5de5\u4f5c\u3002',
    }
  }
  if (mode === 'custom') {
    return {
      title: '\u81ea\u5b9a\u4e49\u8ba1\u65f6\u7ed3\u675f',
      body: '\u672c\u6b21\u81ea\u5b9a\u4e49\u8ba1\u65f6\u5df2\u5b8c\u6210\u3002',
    }
  }
  return {
    title: '\u5de5\u4f5c\u7ed3\u675f',
    body: '\u672c\u6b21\u4e13\u6ce8\u5df2\u5b8c\u6210\uff0c\u53ef\u4ee5\u4f11\u606f\u4e00\u4e0b\u3002',
  }
}

function loadWorkHistory() {
  try {
    const raw = localStorage.getItem(WORK_HISTORY_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null
          }
          if (
            typeof item.id !== 'string' ||
            typeof item.startAt !== 'number' ||
            typeof item.endAt !== 'number' ||
            typeof item.durationSeconds !== 'number' ||
            item.durationSeconds <= 0
          ) {
            return null
          }
          return {
            id: item.id,
            startAt: item.startAt,
            endAt: item.endAt,
            durationSeconds: Math.floor(item.durationSeconds),
            note: typeof item.note === 'string' ? item.note : '',
          }
        })
        .filter(Boolean)
    }
    if (!parsed || typeof parsed !== 'object') {
      return []
    }
    // Legacy format migration: { 'YYYY-MM-DD': number | { seconds, note } }
    return Object.entries(parsed)
      .map(([dateKey, value]) => {
        if (typeof dateKey !== 'string') {
          return null
        }
        const dayStart = new Date(`${dateKey}T00:00:00`).getTime()
        if (Number.isNaN(dayStart)) {
          return null
        }
        const seconds =
          typeof value === 'number'
            ? value
            : value && typeof value === 'object' && typeof value.seconds === 'number'
              ? value.seconds
              : 0
        if (seconds <= 0) {
          return null
        }
        const safeSeconds = Math.floor(seconds)
        return {
          id: `legacy-${dateKey}-${safeSeconds}`,
          startAt: dayStart,
          endAt: dayStart + safeSeconds * 1000,
          durationSeconds: safeSeconds,
          note: value && typeof value === 'object' && typeof value.note === 'string' ? value.note : '',
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function App() {
  const [activeMainTab, setActiveMainTab] = useState('study')
  const [activeTab, setActiveTab] = useState('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [plans, setPlans] = useState(() => loadPlans())
  const [planDraft, setPlanDraft] = useState('')
  const [settings, setSettings] = useState(() => loadSettings())
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finishedTimerMode, setFinishedTimerMode] = useState('work')
  const [exactAlarmGranted, setExactAlarmGranted] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [notificationError, setNotificationError] = useState('')
  const [timerEndAt, setTimerEndAt] = useState(null)
  const [currentSessionStartedAt, setCurrentSessionStartedAt] = useState(null)
  const [currentSessionDurationSeconds, setCurrentSessionDurationSeconds] = useState(0)
  const [activeTimerMode, setActiveTimerMode] = useState('work')
  const [customCountsAsWork, setCustomCountsAsWork] = useState(false)
  const [customDurationSeconds, setCustomDurationSeconds] = useState(DEFAULT_CUSTOM_DURATION_SECONDS)
  const [workHistory, setWorkHistory] = useState(() => loadWorkHistory())
  const needsPermissionGuide = !notificationEnabled || (settings.developerMode && !exactAlarmGranted)

  const workDurationSeconds = FOCUS_DURATION_SECONDS
  const normalizedCustomDurationSeconds = Math.max(1, Math.floor(customDurationSeconds))

  const getModeDuration = (mode) => {
    if (mode === 'rest') return REST_DURATION_SECONDS
    if (mode === 'custom') return normalizedCustomDurationSeconds
    return workDurationSeconds
  }

  const currentModeDurationSeconds = getModeDuration(activeTimerMode)
  const [remainingSeconds, setRemainingSeconds] = useState(workDurationSeconds)

  const saveWorkHistory = (nextHistory) => {
    localStorage.setItem(WORK_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
  }

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
            `打开通知设置失败，请手动进入系统设置 -> 应用 -> StudyFlow。错误: ${String(
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

  const scheduleTimerNotification = async (seconds, mode = 'work') => {
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

      const copy = getTimerCompletionCopy(mode)
      await LocalNotifications.cancel({
        notifications: [{ id: TIMER_NOTIFICATION_ID }],
      })
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TIMER_NOTIFICATION_ID,
            title: copy.title,
            body: copy.body,
            channelId: TIMER_CHANNEL_ID,
            schedule: {
              at: new Date(Date.now() + seconds * 1000),
              allowWhileIdle: false,
            },
          },
        ],
      })
      await refreshNotificationStatus()
    } catch (error) {
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
        const shouldRecordAsWork =
          activeTimerMode === 'work' || (activeTimerMode === 'custom' && customCountsAsWork)
        if (shouldRecordAsWork) {
          const endAt = Date.now()
          const durationSeconds =
            currentSessionDurationSeconds > 0
              ? currentSessionDurationSeconds
              : getModeDuration(activeTimerMode)
          const startAt = currentSessionStartedAt ?? (endAt - durationSeconds * 1000)
          setWorkHistory((previous) => {
            const nextHistory = [
              {
                id: crypto.randomUUID(),
                startAt,
                endAt,
                durationSeconds,
                note: '',
                sourceMode: activeTimerMode,
              },
              ...previous,
            ]
            saveWorkHistory(nextHistory)
            return nextHistory
          })
        }
        setIsRunning(false)
        setIsPaused(false)
        setTimerEndAt(null)
        setCurrentSessionStartedAt(null)
        setCurrentSessionDurationSeconds(0)
        setFinishedTimerMode(activeTimerMode)
        setShowFinishModal(true)
        setRemainingSeconds(getModeDuration(activeTimerMode))
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          void LocalNotifications.cancel({
            notifications: [{ id: TIMER_NOTIFICATION_ID }],
          }).catch(() => { })
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
  }, [
    isRunning,
    timerEndAt,
    activeTimerMode,
    workDurationSeconds,
    normalizedCustomDurationSeconds,
    customCountsAsWork,
    currentSessionStartedAt,
    currentSessionDurationSeconds,
  ])

  useEffect(() => {
    if (!isRunning && !isPaused) {
      setRemainingSeconds(getModeDuration(activeTimerMode))
      if (timerEndAt === null) {
        setCurrentSessionStartedAt(null)
        setCurrentSessionDurationSeconds(0)
      }
    }
  }, [isRunning, isPaused, activeTimerMode, workDurationSeconds, normalizedCustomDurationSeconds, timerEndAt])

  const updateWorkHistoryNote = (sessionId, note) => {
    setWorkHistory((previous) => {
      const nextHistory = previous.map((entry) =>
        entry.id === sessionId
          ? {
            ...entry,
            note: note.trim(),
          }
          : entry,
      )
      saveWorkHistory(nextHistory)
      return nextHistory
    })
  }

  const deleteWorkHistoryEntry = (sessionId) => {
    setWorkHistory((previous) => {
      const nextHistory = previous.filter((entry) => entry.id !== sessionId)
      if (nextHistory.length === previous.length) {
        return previous
      }
      saveWorkHistory(nextHistory)
      return nextHistory
    })
  }

  useEffect(() => {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans))
  }, [plans])

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const progress = useMemo(
    () => (currentModeDurationSeconds - remainingSeconds) / currentModeDurationSeconds,
    [currentModeDurationSeconds, remainingSeconds],
  )

  const doneCount = useMemo(
    () => plans.filter((plan) => plan.completed).length,
    [plans],
  )

  // Focus Circle Params
  const strokeWidth = 14
  const radius = 110
  const circleCircumference = 2 * Math.PI * radius
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

  const mainNavItems = [
    { id: 'study', label: '学习', icon: BookOpenText },
    { id: 'interest', label: '兴趣', icon: Sparkles },
    { id: 'sport', label: '运动', icon: Activity },
    { id: 'settings', label: '设置', icon: Settings },
  ]

  const studySubItems = [
    { id: 'focus', label: '专注' },
    { id: 'plans', label: '计划' },
    { id: 'countdown', label: '倒计时' },
  ]

  const getPageTitle = () => {
    if (activeMainTab === 'interest') return '兴趣'
    if (activeMainTab === 'sport') return '运动'
    if (activeMainTab === 'settings') return '设置'
    return '学习探索'
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-0 text-[#1c1c1e] sm:p-3 overflow-hidden">
      <div className="relative flex h-[100svh] w-full flex-col overflow-hidden sm:h-[96svh] sm:w-auto sm:max-h-[900px] sm:aspect-[9/19.5] sm:rounded-[2.5rem] sm:border-[8px] sm:border-black sm:shadow-2xl bg-transparent">

        {/* iOS Header */}
        <header className="sticky top-0 z-20 glass-card rounded-none border-x-0 border-t-0 px-4 pt-4 pb-3 h-fit flex-none">
          <div className="flex items-center justify-center mb-1 w-full relative h-[28px]">
            <h1 className="text-[17px] font-semibold tracking-tight absolute inset-0 flex items-center justify-center pointer-events-none">
              {getPageTitle()}
            </h1>
          </div>

          {activeMainTab === 'study' && (
            <div className="segmented-control mt-2 w-full max-w-[280px] mx-auto">
              {studySubItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      withFeedback(() => {
                        setActiveTab(item.id)
                      })
                    }
                    className={isActive ? 'active' : ''}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-28">
          {activeTab === 'focus' && activeMainTab === 'study' && (
            <FocusPage
              needsPermissionGuide={needsPermissionGuide}
              withFeedback={withFeedback}
              setActiveMainTab={setActiveMainTab}
              refreshExactAlarmStatus={refreshExactAlarmStatus}
              refreshNotificationStatus={refreshNotificationStatus}
              circleCircumference={circleCircumference}
              strokeOffset={strokeOffset}
              remainingSeconds={remainingSeconds}
              currentModeDurationSeconds={currentModeDurationSeconds}
              cancelTimerNotification={cancelTimerNotification}
              setIsRunning={setIsRunning}
              setTimerEndAt={setTimerEndAt}
              setRemainingSeconds={setRemainingSeconds}
              isRunning={isRunning}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              setCurrentSessionStartedAt={setCurrentSessionStartedAt}
              setCurrentSessionDurationSeconds={setCurrentSessionDurationSeconds}
              scheduleTimerNotification={scheduleTimerNotification}
              radius={radius}
              strokeWidth={strokeWidth}
              activeTimerMode={activeTimerMode}
              setActiveTimerMode={setActiveTimerMode}
              customDurationSeconds={normalizedCustomDurationSeconds}
              setCustomDurationSeconds={setCustomDurationSeconds}
              customCountsAsWork={customCountsAsWork}
              setCustomCountsAsWork={setCustomCountsAsWork}
              getModeDuration={getModeDuration}
              workHistory={workHistory}
              updateWorkHistoryNote={updateWorkHistoryNote}
              deleteWorkHistoryEntry={deleteWorkHistoryEntry}
            />
          )}

          {activeTab === 'plans' && activeMainTab === 'study' && (
            <PlansPage
              plans={plans}
              doneCount={doneCount}
              planDraft={planDraft}
              setPlanDraft={setPlanDraft}
              addPlan={addPlan}
              togglePlan={togglePlan}
              deletePlan={deletePlan}
              withFeedback={withFeedback}
            />
          )}

          {activeTab === 'countdown' && activeMainTab === 'study' && (
            <CountdownPage withFeedback={withFeedback} />
          )}

          {activeMainTab === 'settings' && (
            <SettingsPage
              settings={settings}
              setSettings={setSettings}
              notificationEnabled={notificationEnabled}
              notificationError={notificationError}
              exactAlarmGranted={exactAlarmGranted}
              pendingCount={pendingCount}
              withFeedback={withFeedback}
              openSystemNotificationSettings={openSystemNotificationSettings}
              scheduleTimerNotification={scheduleTimerNotification}
              refreshNotificationStatus={refreshNotificationStatus}
              refreshExactAlarmStatus={refreshExactAlarmStatus}
              setIsRunning={setIsRunning}
              cancelTimerNotification={cancelTimerNotification}
              setRemainingSeconds={setRemainingSeconds}
            />
          )}

          {activeMainTab === 'interest' && (
            <InterestPage />
          )}

          {activeMainTab === 'sport' && (
            <SportPage withFeedback={withFeedback} />
          )}
        </main>

        {/* iOS Tab Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-20 flex bg-white/75 backdrop-blur-[30px] border-t border-[rgba(60,60,67,0.1)] pb-safe-bottom">
          <div className="flex w-full items-start justify-between px-2 pt-2 pb-6">
            {mainNavItems.map((item) => {
              const isActive = activeMainTab === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    withFeedback(() => {
                      setActiveMainTab(item.id)
                      if (item.id === 'study') {
                        setActiveTab('focus')
                      }
                      if (item.id === 'settings') {
                        void refreshExactAlarmStatus()
                        void refreshNotificationStatus()
                      }
                    })
                  }
                  className={`flex flex-1 flex-col items-center gap-[4px] pt-1 text-[10px] font-medium transition-colors ${isActive ? 'text-[#007aff]' : 'text-[#8e8e93]'
                    }`}
                >
                  <Icon
                    size={26}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* iOS Alert Modal */}
        {showFinishModal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4 animate-fade-in">
            <div className="w-[270px] rounded-[14px] bg-white/90 backdrop-blur-xl text-center shadow-2xl flex flex-col overflow-hidden animate-spring-in">
              <div className="p-4 pt-5 pb-4">
                <h3 className="text-[17px] font-semibold text-[#1c1c1e] tracking-tight">
                  {getTimerCompletionCopy(finishedTimerMode).title}
                </h3>
                <p className="mt-1 text-[13px] leading-tight text-[#1c1c1e]">
                  {getTimerCompletionCopy(finishedTimerMode).body}
                </p>
              </div>
              <div className="border-t border-[rgba(60,60,67,0.18)]">
                <button
                  type="button"
                  onClick={() =>
                    withFeedback(() => {
                      setShowFinishModal(false)
                    })
                  }
                  className="w-full text-[#007aff] px-4 py-[11px] text-[17px] font-semibold active:bg-[rgba(60,60,67,0.1)] transition-colors"
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App


