import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from "../localStorage";

export interface UIState {
  activeTab: string;
  activeWorkspace: string;
  activeProjectId: string | null;
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  searchQuery: string;
  commandPaletteOpen: boolean;
  createTaskModalOpen: boolean;
  createBugModalOpen: boolean;
}

const initialSavedUI = loadFromLocalStorage<Partial<UIState>>(STORAGE_KEYS.UI, {});

const initialState: UIState = {
  activeTab: initialSavedUI.activeTab || "overview",
  activeWorkspace: initialSavedUI.activeWorkspace || "MAIN",
  activeProjectId: initialSavedUI.activeProjectId || null,
  sidebarCollapsed: initialSavedUI.sidebarCollapsed || false,
  theme: initialSavedUI.theme || "dark",
  searchQuery: "",
  commandPaletteOpen: false,
  createTaskModalOpen: false,
  createBugModalOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
      saveToLocalStorage(STORAGE_KEYS.UI, {
        activeTab: state.activeTab,
        activeWorkspace: state.activeWorkspace,
        activeProjectId: state.activeProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      });
    },
    setActiveWorkspace: (state, action: PayloadAction<string>) => {
      state.activeWorkspace = action.payload;
      saveToLocalStorage(STORAGE_KEYS.UI, {
        activeTab: state.activeTab,
        activeWorkspace: state.activeWorkspace,
        activeProjectId: state.activeProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      });
    },
    setActiveProjectId: (state, action: PayloadAction<string | null>) => {
      state.activeProjectId = action.payload;
      saveToLocalStorage(STORAGE_KEYS.UI, {
        activeTab: state.activeTab,
        activeWorkspace: state.activeWorkspace,
        activeProjectId: state.activeProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      });
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      saveToLocalStorage(STORAGE_KEYS.UI, {
        activeTab: state.activeTab,
        activeWorkspace: state.activeWorkspace,
        activeProjectId: state.activeProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      });
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      saveToLocalStorage(STORAGE_KEYS.UI, {
        activeTab: state.activeTab,
        activeWorkspace: state.activeWorkspace,
        activeProjectId: state.activeProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      });
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    setCreateTaskModalOpen: (state, action: PayloadAction<boolean>) => {
      state.createTaskModalOpen = action.payload;
    },
    setCreateBugModalOpen: (state, action: PayloadAction<boolean>) => {
      state.createBugModalOpen = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setActiveWorkspace,
  setActiveProjectId,
  toggleSidebar,
  setSidebarCollapsed,
  setSearchQuery,
  setCommandPaletteOpen,
  setCreateTaskModalOpen,
  setCreateBugModalOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
