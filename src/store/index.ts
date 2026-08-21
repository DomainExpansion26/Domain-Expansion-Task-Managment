import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import tasksReducer from "./slices/tasksSlice";
import qaReducer from "./slices/qaSlice";
import notificationsReducer from "./slices/notificationsSlice";
import hrmsReducer from "./slices/hrmsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    tasks: tasksReducer,
    qa: qaReducer,
    notifications: notificationsReducer,
    hrms: hrmsReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
