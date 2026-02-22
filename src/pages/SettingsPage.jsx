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

      {/* General Settings Group */}
      <div>
        <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-widest text-[#8e8e93]">通用</h2>
        <div className="ios-list-group shadow-sm">
          <label className="ios-list-row cursor-pointer" style={{ paddingRight: '12px' }}>
            <div className="flex flex-col flex-1 pr-4">
              <p className="text-[17px] font-semibold text-[#1c1c1e] leading-tight">按键震动反馈</p>
              <p className="text-[13px] text-[#8e8e93] font-medium leading-tight mt-1">点击按钮时触发轻微震动</p>
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

      {/* Notifications Group */}
      <div>
        <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-widest text-[#8e8e93]">通知</h2>
        <div className="ios-list-group shadow-sm p-4">
          <p className="text-[17px] font-semibold text-[#1c1c1e]">后台到点通知</p>
          <p className="mt-1 text-[13px] text-[#8e8e93] leading-snug">
            {notificationEnabled
              ? '请确保 StudyFlow Alerts 通道已开启弹窗/悬浮/横幅'
              : '系统级通知开关已关闭，请先开启'}
          </p>
          <button
            type="button"
            onClick={() => {
              withFeedback(() => {
                void openSystemNotificationSettings()
              })
            }}
            className="mt-4 w-full h-[40px] rounded-[10px] bg-[rgba(60,60,67,0.08)] text-[15px] font-semibold text-[#007aff] transition active:bg-[rgba(60,60,67,0.15)]"
          >
            打开系统通知设置
          </button>

          {notificationError && (
            <p className="mt-3 text-[13px] text-[#ff3b30] bg-[#ff3b30]/10 p-2 rounded-lg">{`错误: ${notificationError}`}</p>
          )}

          <div className="mt-4 rounded-[12px] bg-white border border-[rgba(60,60,67,0.1)] p-3">
            <p className="text-[13px] font-semibold text-[#1c1c1e]">授权指引</p>
            <p className="mt-1 text-[12px] text-[#8e8e93]">
              1. 打开通道设置后，确保勾选了「弹窗」或「横幅」。<br />
              2. 若主通知开关被拒，请先在系统授予 App 通知权。
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Settings Group */}
      <div>
        <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-widest text-[#8e8e93]">开发者</h2>
        <div className="ios-list-group shadow-sm">
          <label className="ios-list-row cursor-pointer" style={{ paddingRight: '12px' }}>
            <div className="flex flex-col flex-1 pr-4">
              <p className="text-[17px] font-semibold text-[#1c1c1e] leading-tight">开启开发者功能</p>
              <p className="text-[13px] text-[#8e8e93] font-medium leading-tight mt-1">显示测试通知、精确提醒等操作</p>
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
                  <p className="text-[17px] font-semibold text-[#1c1c1e] leading-tight">短时专注 (5秒测试)</p>
                  <p className="text-[13px] text-[#8e8e93] font-medium leading-tight mt-1">专时专注缩短为 5秒 用以全流程测试</p>
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

              <div className="ios-list-row flex-col items-stretch p-4 gap-3 bg-[rgba(118,118,128,0.06)] border-t-0">
                <div>
                  <p className="text-[15px] font-semibold text-[#1c1c1e]">调试看板</p>
                  <p className="text-[13px] text-[#8e8e93] mt-1">
                    {exactAlarmGranted ? '精确提醒已开启' : '精确提醒未开启，短时通知可能延迟'}
                    <br />
                    待触发的通知队列: {pendingCount}
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
                    className="flex-1 rounded-[10px] bg-[#007aff] px-3 py-2 text-[14px] font-semibold text-white transition active:opacity-70"
                  >
                    发送 3秒 通知
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
                    className="flex-1 rounded-[10px] bg-[rgba(60,60,67,0.1)] px-3 py-2 text-[14px] font-semibold text-[#1c1c1e] transition active:bg-[rgba(60,60,67,0.2)]"
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
                  className="w-full rounded-[10px] bg-white border border-[rgba(60,60,67,0.1)] px-3 py-2 text-[14px] font-semibold text-[#1c1c1e] transition active:bg-gray-50 shadow-sm"
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
