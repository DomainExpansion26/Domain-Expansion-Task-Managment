import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// Use throughout app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience Domain Hooks
export const useAuth = () => useAppSelector((state) => state.auth);
export const useUI = () => useAppSelector((state) => state.ui);
export const useTasks = () => useAppSelector((state) => state.tasks);
export const useQA = () => useAppSelector((state) => state.qa);
export const useNotifications = () => useAppSelector((state) => state.notifications);
export const useHRMS = () => useAppSelector((state) => state.hrms);
