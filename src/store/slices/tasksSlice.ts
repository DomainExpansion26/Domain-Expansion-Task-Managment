import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from "../localStorage";

export interface TaskItem {
  id: string;
  taskKey: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  taskType: string;
  projectId: string;
  project?: { id: string; name: string; key: string };
  assignees?: Array<{ user: { id: string; name: string; email: string; avatarUrl?: string | null } }>;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  loggedHours?: number | null;
  subtasks?: any[];
  comments?: any[];
  qaBugs?: any[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface TasksState {
  items: TaskItem[];
  selectedTaskId: string | null;
  selectedTask: TaskItem | null;
  filterStatus: string;
  filterPriority: string;
  filterAssignee: string;
  filterType: string;
  viewMode: "list" | "board" | "table";
  loading: boolean;
  lastFetched: number | null;
}

const savedTasks = loadFromLocalStorage<{ items?: TaskItem[]; viewMode?: "list" | "board" | "table" }>(
  STORAGE_KEYS.TASKS,
  {}
);

const initialState: TasksState = {
  items: savedTasks.items || [],
  selectedTaskId: null,
  selectedTask: null,
  filterStatus: "ALL",
  filterPriority: "ALL",
  filterAssignee: "ALL",
  filterType: "ALL",
  viewMode: savedTasks.viewMode || "list",
  loading: false,
  lastFetched: null,
};

export const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<TaskItem[]>) => {
      state.items = action.payload;
      state.lastFetched = Date.now();
      saveToLocalStorage(STORAGE_KEYS.TASKS, {
        items: state.items,
        viewMode: state.viewMode,
      });
    },
    upsertTask: (state, action: PayloadAction<TaskItem>) => {
      const idx = state.items.findIndex(
        (t) => t.id === action.payload.id || t.taskKey === action.payload.taskKey
      );
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...action.payload };
      } else {
        state.items.unshift(action.payload);
      }
      if (state.selectedTask && (state.selectedTask.id === action.payload.id || state.selectedTask.taskKey === action.payload.taskKey)) {
        state.selectedTask = { ...state.selectedTask, ...action.payload };
      }
      saveToLocalStorage(STORAGE_KEYS.TASKS, {
        items: state.items,
        viewMode: state.viewMode,
      });
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload && t.taskKey !== action.payload);
      if (state.selectedTaskId === action.payload) {
        state.selectedTaskId = null;
        state.selectedTask = null;
      }
      saveToLocalStorage(STORAGE_KEYS.TASKS, {
        items: state.items,
        viewMode: state.viewMode,
      });
    },
    updateTaskStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const task = state.items.find((t) => t.id === action.payload.id || t.taskKey === action.payload.id);
      if (task) {
        task.status = action.payload.status;
      }
      if (state.selectedTask && (state.selectedTask.id === action.payload.id || state.selectedTask.taskKey === action.payload.id)) {
        state.selectedTask.status = action.payload.status;
      }
      saveToLocalStorage(STORAGE_KEYS.TASKS, {
        items: state.items,
        viewMode: state.viewMode,
      });
    },
    setSelectedTaskId: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
      if (action.payload) {
        state.selectedTask =
          state.items.find((t) => t.id === action.payload || t.taskKey === action.payload) || null;
      } else {
        state.selectedTask = null;
      }
    },
    setSelectedTask: (state, action: PayloadAction<TaskItem | null>) => {
      state.selectedTask = action.payload;
      state.selectedTaskId = action.payload ? action.payload.id : null;
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterStatus = action.payload;
    },
    setFilterPriority: (state, action: PayloadAction<string>) => {
      state.filterPriority = action.payload;
    },
    setFilterAssignee: (state, action: PayloadAction<string>) => {
      state.filterAssignee = action.payload;
    },
    setFilterType: (state, action: PayloadAction<string>) => {
      state.filterType = action.payload;
    },
    setViewMode: (state, action: PayloadAction<"list" | "board" | "table">) => {
      state.viewMode = action.payload;
      saveToLocalStorage(STORAGE_KEYS.TASKS, {
        items: state.items,
        viewMode: state.viewMode,
      });
    },
    setTasksLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setTasks,
  upsertTask,
  removeTask,
  updateTaskStatus,
  setSelectedTaskId,
  setSelectedTask,
  setFilterStatus,
  setFilterPriority,
  setFilterAssignee,
  setFilterType,
  setViewMode,
  setTasksLoading,
} = tasksSlice.actions;

export default tasksSlice.reducer;
