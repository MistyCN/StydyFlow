import {
  PLAN_STORAGE_KEY,
  LEGACY_MEMO_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from './constants'

export function loadSettings() {
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

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function normalizePlan(item) {
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
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
    }
  }

  return null
}

export function loadPlans() {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map(normalizePlan).filter(Boolean)
      }
    }
  } catch {
    // fall through to legacy
  }

  try {
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

export function createPlan(title) {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    updatedAt: Date.now(),
  }
}

export function formatPlanTime(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
