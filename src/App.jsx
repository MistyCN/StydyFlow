import { useEffect, useMemo, useState } from 'react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Activity, BookOpenText, CalendarDays, Clock3, Settings, Sparkles } from 'lucide-react'

import {
  FOCUS_DURATION_SECONDS,
  DEBUG_FOCUS_DURATION_SECONDS,
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

function App() {
  const [activeMainTab, setActiveMainTab] = useState('study')
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

  const mainNavItems = [
    { id: 'study', label: '\u5b66\u4e60', icon: BookOpenText },
    { id: 'interest', label: '\u5174\u8da3', icon: Sparkles },
    { id: 'sport', label: '\u8fd0\u52a8', icon: Activity },
    { id: 'settings', label: '\u8bbe\u7f6e', icon: Settings },
  ]

  const studySubItems = [
    { id: 'focus', label: '\u4e13\u6ce8', icon: Clock3 },
    { id: 'plans', label: '\u8ba1\u5212', icon: BookOpenText },
    { id: 'countdown', label: '\u5012\u8ba1\u65e5', icon: CalendarDays },
  ]

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F0F2F5] p-0 text-slate-800 sm:p-3">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#25D366]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-56 w-56 rounded-full bg-[#008069]/15 blur-3xl" />

      <div className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-[#F0F2F5] sm:h-[96svh] sm:w-auto sm:max-h-[900px] sm:aspect-[9/19.5] sm:rounded-[2rem] sm:border sm:border-white/70 sm:shadow-2xl">
        <header className="sticky top-0 z-20 bg-gradient-to-r from-[#008069] to-[#0a8f75] px-5 py-5 text-white shadow-lg">
          <h1 className="text-xl font-bold tracking-wide">STUDYFLOW</h1>
          {activeMainTab === 'study' && (
            <div className="mt-3 flex gap-1 rounded-2xl bg-black/20 p-1">
              {studySubItems.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      withFeedback(() => {
                        setActiveTab(item.id)
                      })
                    }
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-medium transition active:bg-white/20 ${
                      isActive ? 'bg-white text-[#008069] shadow' : 'text-white/80'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-32">
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
              focusDurationSeconds={focusDurationSeconds}
              cancelTimerNotification={cancelTimerNotification}
              setIsRunning={setIsRunning}
              setTimerEndAt={setTimerEndAt}
              setRemainingSeconds={setRemainingSeconds}
              isRunning={isRunning}
              scheduleTimerNotification={scheduleTimerNotification}
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

        <nav className="absolute bottom-3 left-2 right-2 z-20 flex rounded-2xl border border-white/70 bg-white/90 p-1 shadow-xl backdrop-blur">
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
