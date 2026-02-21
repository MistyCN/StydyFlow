import { Clock3 } from 'lucide-react'
import { formatTime } from '../utils'

export default function FocusPage({
  needsPermissionGuide,
  withFeedback,
  setActiveMainTab,
  refreshExactAlarmStatus,
  refreshNotificationStatus,
  circleCircumference,
  strokeOffset,
  remainingSeconds,
  focusDurationSeconds,
  cancelTimerNotification,
  setIsRunning,
  setTimerEndAt,
  setRemainingSeconds,
  isRunning,
  scheduleTimerNotification,
}) {
  return (
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
                setActiveMainTab('settings')
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
  )
}
