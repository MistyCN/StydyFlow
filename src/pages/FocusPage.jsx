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
  radius = 110,
  strokeWidth = 14,
}) {
  return (
    <section className="animate-fade-in flex min-h-full flex-col items-center justify-center gap-8 relative mt-[-20px]">
      {needsPermissionGuide && (
        <div className="w-full rounded-[14px] bg-[rgba(255,59,48,0.1)] px-4 py-3 text-left backdrop-blur-md">
          <p className="text-[13px] font-semibold text-[#ff3b30]">开启通知权限</p>
          <p className="mt-1 text-[12px] leading-tight text-[#ff3b30]/80">
            请确认已开启弹窗/悬浮/横幅通知，否则退到后台可能收不到提醒。
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
            className="mt-2 rounded-lg bg-white/60 px-3 py-1.5 text-[12px] font-semibold text-[#ff3b30] transition active:bg-white/40 shadow-sm"
          >
            去设置
          </button>
        </div>
      )}

      <div className="w-full relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg className="h-72 w-72 -rotate-90 transform-gpu" viewBox="0 0 240 240">
            {/* Track */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="var(--ios-gray6)"
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="var(--ios-blue)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[64px] font-bold text-[#1c1c1e] tabular-nums tracking-tight leading-none mb-1">
              {formatTime(remainingSeconds)}
            </span>
            <span className="text-[15px] font-medium text-[#8e8e93]">
              {isRunning ? '专注中' : '准备开始'}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-center w-full max-w-[200px]">
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
            className={`w-full rounded-full py-[14px] text-[17px] font-semibold transition-all active:scale-95 shadow-md ${isRunning
                ? 'bg-[#f2f2f7] text-[#ff3b30] active:bg-[#e5e5ea]'
                : 'bg-[#007aff] text-white active:bg-[#006ee6]'
              }`}
          >
            {isRunning ? '暂停' : '开始'}
          </button>
        </div>

        {!isRunning && remainingSeconds < focusDurationSeconds && (
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
            className="mt-4 text-[15px] text-[#8e8e93] active:text-[#1c1c1e] font-medium transition-colors"
          >
            重置计时
          </button>
        )}
      </div>
    </section>
  )
}
