/**
 * Safe client-side LocalStorage utility with error handling and SSR safety.
 */

export const STORAGE_KEYS = {
  AUTH: "dx_auth_state",
  UI: "dx_ui_state",
  TASKS: "dx_tasks_cache",
  QA: "dx_qa_cache",
  NOTIFICATIONS: "dx_notifications_cache",
  HRMS: "dx_hrms_cache",
  DRAFT_COMMENTS: "dx_draft_comments",
  RECENT_SEARCHES: "dx_recent_searches",
} as const;

export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[LocalStorage] Error reading key "${key}":`, error);
    return fallback;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[LocalStorage] Error saving key "${key}":`, error);
  }
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[LocalStorage] Error removing key "${key}":`, error);
  }
}

export function clearAllDXStorage(): void {
  if (typeof window === "undefined") return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("[LocalStorage] Error clearing all DX storage keys:", error);
  }
}
