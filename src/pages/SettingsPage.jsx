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
  )
}
