import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage, STORAGE_KEYS } from "../localStorage";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  hrmsStatus?: string;
  isHRMSActive?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  permissions: string[];
  portal: string;
  isAuthenticated: boolean;
  isLoaded: boolean;
}

const initialSavedAuth = loadFromLocalStorage<Partial<AuthState>>(STORAGE_KEYS.AUTH, {});

const initialState: AuthState = {
  user: initialSavedAuth.user || null,
  token: initialSavedAuth.token || null,
  permissions: initialSavedAuth.permissions || [],
  portal: initialSavedAuth.portal || "MAIN",
  isAuthenticated: Boolean(initialSavedAuth.token && initialSavedAuth.user),
  isLoaded: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserProfile;
        token: string;
        permissions?: string[];
        portal?: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.permissions = action.payload.permissions || [];
      state.portal = action.payload.portal || state.portal;
      state.isAuthenticated = true;
      state.isLoaded = true;

      // Persist to LocalStorage
      saveToLocalStorage(STORAGE_KEYS.AUTH, {
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        portal: state.portal,
      });
    },
    updateUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        saveToLocalStorage(STORAGE_KEYS.AUTH, {
          user: state.user,
          token: state.token,
          permissions: state.permissions,
          portal: state.portal,
        });
      }
    },
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      saveToLocalStorage(STORAGE_KEYS.AUTH, {
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        portal: state.portal,
      });
    },
    setPortal: (state, action: PayloadAction<string>) => {
      state.portal = action.payload;
      saveToLocalStorage(STORAGE_KEYS.AUTH, {
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        portal: state.portal,
      });
    },
    setAuthLoaded: (state, action: PayloadAction<boolean>) => {
      state.isLoaded = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoaded = true;
      removeFromLocalStorage(STORAGE_KEYS.AUTH);
    },
  },
});

export const { setCredentials, updateUser, setPermissions, setPortal, setAuthLoaded, logout } =
  authSlice.actions;

export default authSlice.reducer;
