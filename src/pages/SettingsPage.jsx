import { LocalNotifications } from '@capacitor/local-notifications'
import { FOCUS_DURATION_SECONDS, DEBUG_FOCUS_DURATION_SECONDS } from '../constants'

export default function SettingsPage({
  settings,
  setSettings,
  notificationEnabled,
  notificationError,
  exactAlarmGranted,
  pendingCount,
  withFeedback,
  openSystemNotificationSettings,
  scheduleTimerNotification,
  refreshNotificationStatus,
  refreshExactAlarmStatus,
  setIsRunning,
  cancelTimerNotification,
  setRemainingSeconds,
}) {
  return (
    <section className="animate-fade-in flex flex-col gap-6 pb-6 pt-2">
      <p className="text-ink-subtle text-center text-[13px]">StudyFlow v2.1</p>

      <div>
        <h2 className="text-ink-subtle px-4 pb-2 text-[13px] font-semibold uppercase tracking-widest">通用</h2>
        <div className="ios-list-group shadow-sm">
          <label className="ios-list-row cursor-pointer" style={{ paddingRight: '12px' }}>
            <div className="flex flex-col flex-1 pr-4">
              <p className="text-ink text-[17px] font-semibold leading-tight">按键震动反馈</p>
              <p className="text-ink-subtle mt-1 text-[13px] font-medium leading-tight">点击按钮时触发轻微震动</p>
            </div>
            <div className="ios-toggle">
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(event) => {
                  withFeedback(() => {
                    setSettings((previous) => ({
                      ...previous,
                      vibrationEnabled: event.target.checked,
                    }))
                  })
                }}
              />
              <span className="ios-toggle-track"></span>
              <span className="ios-toggle-thumb"></span>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h2 className="text-ink-subtle px-4 pb-2 text-[13px] font-semibold uppercase tracking-widest">通知</h2>
        <div className="ios-list-group shadow-sm p-4">
          <p className="text-ink text-[17px] font-semibold">后台倒数日提醒</p>
          <p className="text-ink-subtle mt-1 text-[13px] leading-snug">
            {notificationEnabled
              ? '请确认 StudyFlow Alerts 通道已开启弹窗/悬浮/横幅提醒。'
              : '系统通知总开关已关闭，请先开启应用通知权限。'}
          </p>
          <button
            type="button"
            onClick={() => {
              withFeedback(() => {
                void openSystemNotificationSettings()
              })
            }}
            className="liquid-outline liquid-ripple mt-4 h-[40px] w-full rounded-[10px] text-[15px] font-semibold text-[#2d78dc] transition"
          >
            打开系统通知设置
          </button>

          {notificationError && (
            <p className="mt-3 text-[13px] text-[#ff3b30] bg-[#ff3b30]/10 p-2 rounded-lg">{`错误: ${notificationError}`}</p>
          )}

          <div className="glass-soft mt-4 rounded-[12px] border border-white/40 p-3">
            <p className="text-ink text-[13px] font-semibold">授权指引</p>
            <p className="text-ink-subtle mt-1 text-[12px]">
              1. 打开通知通道后，确保勾选了“弹窗”或“横幅”。
              <br />
              2. 若系统级通知被拒绝，请先在系统里为 App 开启通知权限。
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-ink-subtle px-4 pb-2 text-[13px] font-semibold uppercase tracking-widest">开发者</h2>
        <div className="ios-list-group shadow-sm">
          <label className="ios-list-row cursor-pointer" style={{ paddingRight: '12px' }}>
            <div className="flex flex-col flex-1 pr-4">
              <p className="text-ink text-[17px] font-semibold leading-tight">开启开发者功能</p>
              <p className="text-ink-subtle mt-1 text-[13px] font-medium leading-tight">显示测试通知、精确提醒等调试操作</p>
            </div>
            <div className="ios-toggle">
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
              />
              <span className="ios-toggle-track"></span>
              <span className="ios-toggle-thumb"></span>
            </div>
          </label>

          {settings.developerMode && (
            <>
              <label className="ios-list-row cursor-pointer" style={{ paddingRight: '12px' }}>
                <div className="flex flex-col flex-1 pr-4">
                  <p className="text-ink text-[17px] font-semibold leading-tight">短时专注 (5秒测试)</p>
                  <p className="text-ink-subtle mt-1 text-[13px] font-medium leading-tight">将专注时间缩短为 5 秒，用于快速测试流程</p>
                </div>
                <div className="ios-toggle">
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
                  />
                  <span className="ios-toggle-track"></span>
                  <span className="ios-toggle-thumb"></span>
                </div>
              </label>

              <div className="px-4 pb-4 pt-2 flex flex-col gap-3 border-t border-[rgba(60,60,67,0.1)]">
                <div>
                  <p className="text-ink text-[15px] font-semibold">调试看板</p>
                  <p className="text-ink-subtle mt-1 text-[13px]">
                    {exactAlarmGranted ? '精确提醒已开启' : '精确提醒未开启，短时通知可能延迟'}
                    <br />
                    待触发通知队列: {pendingCount}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      withFeedback(() => {
                        void scheduleTimerNotification(3)
                      })
                    }}
                    className="liquid-primary liquid-ripple flex-1 rounded-[10px] px-3 py-2 text-[14px] font-semibold transition active:opacity-70"
                  >
                    发送 3 秒通知
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
                    className="liquid-outline liquid-ripple flex-1 rounded-[10px] px-3 py-2 text-[14px] font-semibold text-ink transition"
                  >
                    开启精确提醒
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
                  className="liquid-outline liquid-ripple w-full rounded-[10px] px-3 py-2 text-[14px] font-semibold text-ink transition"
                >
                  刷新权限与队列状态
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
