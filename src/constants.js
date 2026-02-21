import { registerPlugin } from '@capacitor/core'

export const PLAN_STORAGE_KEY = 'studyflow-plans'
export const LEGACY_MEMO_STORAGE_KEY = 'studyflow-memos'
export const SETTINGS_STORAGE_KEY = 'studyflow-settings'
export const FOCUS_DURATION_SECONDS = 25 * 60
export const DEBUG_FOCUS_DURATION_SECONDS = 5
export const TIMER_NOTIFICATION_ID = 1001
export const TIMER_CHANNEL_ID = 'studyflow-alerts'
export const SettingsBridge = registerPlugin('SettingsBridge')
