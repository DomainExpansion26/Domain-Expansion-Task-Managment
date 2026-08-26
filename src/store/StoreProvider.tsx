"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./index";
import { setCredentials, setAuthLoaded, logout } from "./slices/authSlice";
import { loadFromLocalStorage, STORAGE_KEYS, saveToLocalStorage } from "./localStorage";
import { useAppSelector } from "./hooks";

function ThemeInitializer() {
  const theme = useAppSelector((state) => state.ui?.theme || "dark");

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const body = document.body;
      if (theme === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
        if (body) {
          body.classList.add("light");
          body.classList.remove("dark");
          body.setAttribute("data-theme", "light");
        }
      } else {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
        if (body) {
          body.classList.add("dark");
          body.classList.remove("light");
          body.setAttribute("data-theme", "dark");
        }
      }
    }
  }, [theme]);

  return null;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Initial rehydration from LocalStorage
    const savedAuth = loadFromLocalStorage<any>(STORAGE_KEYS.AUTH, null);
    if (savedAuth && savedAuth.user && savedAuth.token) {
      store.dispatch(
        setCredentials({
          user: savedAuth.user,
          token: savedAuth.token,
          permissions: savedAuth.permissions || [],
          portal: savedAuth.portal || "MAIN",
        })
      );
    }

    // 2. Fetch live session from server to ensure token & permissions are fully verified
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          store.dispatch(
            setCredentials({
              user: json.data.user,
              token: savedAuth?.token || "session-active",
              permissions: json.data.permissions || [],
            })
          );
        } else {
          // If server says unauthorized, clear invalid local state
          if (savedAuth && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/create-account") && !window.location.pathname.includes("/signup")) {
            // Keep local state unless explicitly invalid
          }
        }
      })
      .catch((err) => {
        console.warn("[StoreProvider] Background session verification warning:", err);
      })
      .finally(() => {
        store.dispatch(setAuthLoaded(true));
      });
  }, []);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeInitializer />
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
