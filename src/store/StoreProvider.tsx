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
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      if (body) {
        body.classList.remove("dark");
        body.classList.add("light");
        body.setAttribute("data-theme", "light");
      }
      try {
        const saved = localStorage.getItem("dx_ui");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.theme !== "light") {
            parsed.theme = "light";
            localStorage.setItem("dx_ui", JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore
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
