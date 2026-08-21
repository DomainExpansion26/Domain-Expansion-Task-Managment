import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from "../localStorage";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  bugId?: string | null;
  taskId?: string | null;
  createdAt: string;
}

export interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
  open: boolean;
  lastFetched: number | null;
}

const savedNotifications = loadFromLocalStorage<{ items?: NotificationItem[]; unreadCount?: number }>(
  STORAGE_KEYS.NOTIFICATIONS,
  {}
);

const initialState: NotificationsState = {
  items: savedNotifications.items || [],
  unreadCount: savedNotifications.unreadCount || 0,
  open: false,
  lastFetched: null,
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
      state.lastFetched = Date.now();
      saveToLocalStorage(STORAGE_KEYS.NOTIFICATIONS, {
        items: state.items,
        unreadCount: state.unreadCount,
      });
    },
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      saveToLocalStorage(STORAGE_KEYS.NOTIFICATIONS, {
        items: state.items,
        unreadCount: state.unreadCount,
      });
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.items.find((n) => n.id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        saveToLocalStorage(STORAGE_KEYS.NOTIFICATIONS, {
          items: state.items,
          unreadCount: state.unreadCount,
        });
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
      saveToLocalStorage(STORAGE_KEYS.NOTIFICATIONS, {
        items: state.items,
        unreadCount: 0,
      });
    },
    toggleNotificationPanel: (state) => {
      state.open = !state.open;
    },
    setNotificationPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  toggleNotificationPanel,
  setNotificationPanelOpen,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
