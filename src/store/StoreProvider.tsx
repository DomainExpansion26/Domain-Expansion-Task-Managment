"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./index";
import { setCredentials, setAuthLoaded, logout } from "./slices/authSlice";
import { loadFromLocalStorage, STORAGE_KEYS, saveToLocalStorage } from "./localStorage";

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
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
