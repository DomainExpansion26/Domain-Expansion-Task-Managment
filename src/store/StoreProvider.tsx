"use client";

import React, { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "./index";
import { setCredentials, setAuthLoaded } from "./slices/authSlice";
import { loadFromLocalStorage, STORAGE_KEYS } from "./localStorage";
import { useAppDispatch } from "./hooks";

function ThemeInitializer() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const body = document.body;
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      if (body) {
        body.classList.add("dark");
        body.classList.remove("light");
        body.setAttribute("data-theme", "dark");
      }
    }
  }, []);

  return null;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    try {
      // 1. Initial rehydration from LocalStorage
      const savedAuth = loadFromLocalStorage<any>(STORAGE_KEYS.AUTH, null);
      if (savedAuth && savedAuth.user && savedAuth.token) {
        dispatch(
          setCredentials({
            user: savedAuth.user,
            token: savedAuth.token,
            permissions: savedAuth.permissions || [],
            portal: savedAuth.portal || "MAIN",
          })
        );
      }

      // 2. Fetch live session from server
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.user) {
            dispatch(
              setCredentials({
                user: json.data.user,
                token: savedAuth?.token || "session-active",
                permissions: json.data.permissions || [],
              })
            );
          }
        })
        .catch((err) => {
          console.warn("[StoreProvider] Background session verification warning:", err);
        })
        .finally(() => {
          dispatch(setAuthLoaded(true));
        });
    } catch (e) {
      console.warn("[StoreProvider] Initialization error:", e);
      dispatch(setAuthLoaded(true));
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeInitializer />
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
