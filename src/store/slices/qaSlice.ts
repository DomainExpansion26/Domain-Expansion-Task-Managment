import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from "../localStorage";

export interface QABugItem {
  id: string;
  bugKey: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  severity: string;
  status: string;
  environment?: string | null;
  stepsToReproduce?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  failureReason?: string | null;
  projectId: string;
  project?: { id: string; name: string; key: string };
  ticketId?: string | null;
  relatedTaskId?: string | null;
  relatedTask?: { id: string; taskKey: string; title: string; status: string } | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string; avatarUrl?: string | null };
  comments?: any[];
  activities?: any[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface QATicketItem {
  id: string;
  ticketKey: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string };
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string };
  bugs?: QABugItem[];
  createdAt: string;
  [key: string]: any;
}

export interface QAStats {
  totalTickets: number;
  totalBugs: number;
  openBugs: number;
  inProgressBugs: number;
  readyForTestingBugs: number;
  inTestingBugs: number;
  passedBugs: number;
  failedBugs: number;
  closedBugs: number;
  criticalBugs: number;
  passRate: number;
}

export interface QAState {
  bugs: QABugItem[];
  tickets: QATicketItem[];
  stats: QAStats | null;
  selectedBugId: string | null;
  selectedBug: QABugItem | null;
  selectedTicketId: string | null;
  activeQATab: "cockpit" | "tickets" | "bugs" | "board";
  filterStatus: string;
  filterPriority: string;
  filterSeverity: string;
  loading: boolean;
  lastFetched: number | null;
}

const savedQA = loadFromLocalStorage<{
  bugs?: QABugItem[];
  tickets?: QATicketItem[];
  stats?: QAStats;
  activeQATab?: "cockpit" | "tickets" | "bugs" | "board";
}>(STORAGE_KEYS.QA, {});

const initialState: QAState = {
  bugs: savedQA.bugs || [],
  tickets: savedQA.tickets || [],
  stats: savedQA.stats || null,
  selectedBugId: null,
  selectedBug: null,
  selectedTicketId: null,
  activeQATab: savedQA.activeQATab || "cockpit",
  filterStatus: "ALL",
  filterPriority: "ALL",
  filterSeverity: "ALL",
  loading: false,
  lastFetched: null,
};

export const qaSlice = createSlice({
  name: "qa",
  initialState,
  reducers: {
    setQABugs: (state, action: PayloadAction<QABugItem[]>) => {
      state.bugs = action.payload;
      state.lastFetched = Date.now();
      saveToLocalStorage(STORAGE_KEYS.QA, {
        bugs: state.bugs,
        tickets: state.tickets,
        stats: state.stats,
        activeQATab: state.activeQATab,
      });
    },
    upsertQABug: (state, action: PayloadAction<QABugItem>) => {
      const idx = state.bugs.findIndex(
        (b) => b.id === action.payload.id || b.bugKey === action.payload.bugKey
      );
      if (idx >= 0) {
        state.bugs[idx] = { ...state.bugs[idx], ...action.payload };
      } else {
        state.bugs.unshift(action.payload);
      }
      if (state.selectedBug && (state.selectedBug.id === action.payload.id || state.selectedBug.bugKey === action.payload.bugKey)) {
        state.selectedBug = { ...state.selectedBug, ...action.payload };
      }
      saveToLocalStorage(STORAGE_KEYS.QA, {
        bugs: state.bugs,
        tickets: state.tickets,
        stats: state.stats,
        activeQATab: state.activeQATab,
      });
    },
    removeQABug: (state, action: PayloadAction<string>) => {
      state.bugs = state.bugs.filter((b) => b.id !== action.payload && b.bugKey !== action.payload);
      if (state.selectedBugId === action.payload) {
        state.selectedBugId = null;
        state.selectedBug = null;
      }
      saveToLocalStorage(STORAGE_KEYS.QA, {
        bugs: state.bugs,
        tickets: state.tickets,
        stats: state.stats,
        activeQATab: state.activeQATab,
      });
    },
    setQATickets: (state, action: PayloadAction<QATicketItem[]>) => {
      state.tickets = action.payload;
      saveToLocalStorage(STORAGE_KEYS.QA, {
        bugs: state.bugs,
        tickets: state.tickets,
        stats: state.stats,
        activeQATab: state.activeQATab,
      });
    },
    upsertQATicket: (state, action: PayloadAction<QATicketItem>) => {
      const idx = state.tickets.findIndex(
        (t) => t.id === action.payload.id || t.ticketKey === action.payload.ticketKey
      );
      if (idx >= 0) {
        state.tickets[idx] = { ...state.tickets[idx], ...action.payload };
      } else {
        state.tickets.unshift(action.payload);
      }
      saveToLocalStorage(STORAGE_KEYS.QA, {
        bugs: state.bugs,
        tickets: state.tickets,
        stats: state.stats,
        activeQATab: state.activeQATab,
      });
    },
    setQAStats: (state, action: PayloadAction<QAStats>) => {
      state.stats = action.payload;
      saveToLocalStorage(STORAGE_KEYS.QA, {
        bugs: state.bugs,
        tickets: state.tickets,
        stats: state.stats,
        activeQATab: state.activeQATab,
      });
    },
    setSelectedBugId: (state, action: PayloadAction<string | null>) => {
      state.selectedBugId = action.payload;
      if (action.payload) {
        state.selectedBug =
          state.bugs.find((b) => b.id === action.payload || b.bugKey === action.payload) || null;
      } else {
        state.selectedBug = null;
      }
    },
    setSelectedBug: (state, action: PayloadAction<QABugItem | null>) => {
      state.selectedBug = action.payload;
      state.selectedBugId = action.payload ? action.payload.id : null;
    },
    setActiveQATab: (state, action: PayloadAction<"cockpit" | "tickets" | "bugs" | "board">) => {
      state.activeQATab = action.payload;
      saveToLocalStorage(STORAGE_KEYS.QA, {
        bugs: state.bugs,
        tickets: state.tickets,
        stats: state.stats,
        activeQATab: state.activeQATab,
      });
    },
    setQAFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterStatus = action.payload;
    },
    setQAFilterPriority: (state, action: PayloadAction<string>) => {
      state.filterPriority = action.payload;
    },
    setQAFilterSeverity: (state, action: PayloadAction<string>) => {
      state.filterSeverity = action.payload;
    },
    setQALoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setQABugs,
  upsertQABug,
  removeQABug,
  setQATickets,
  upsertQATicket,
  setQAStats,
  setSelectedBugId,
  setSelectedBug,
  setActiveQATab,
  setQAFilterStatus,
  setQAFilterPriority,
  setQAFilterSeverity,
  setQALoading,
} = qaSlice.actions;

export default qaSlice.reducer;
