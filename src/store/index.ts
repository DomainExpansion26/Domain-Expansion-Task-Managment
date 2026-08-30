import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import tasksReducer from "./slices/tasksSlice";
import qaReducer from "./slices/qaSlice";
import notificationsReducer from "./slices/notificationsSlice";
import hrmsReducer from "./slices/hrmsSlice";

export const makeStore = () => {
  return configureStore({
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
};

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
