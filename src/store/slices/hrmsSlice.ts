import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from "../localStorage";

export interface HRProfileData {
  id?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  joiningDate?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  status?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  punchIn?: string | null;
  punchOut?: string | null;
  status: string;
  workHours?: number | null;
}

export interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
}

export interface HRMSState {
  profile: HRProfileData | null;
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  isPunchedIn: boolean;
  lastPunchTime: string | null;
  activeView: "dashboard" | "attendance" | "leaves" | "directory" | "reports";
  loading: boolean;
}

const savedHRMS = loadFromLocalStorage<Partial<HRMSState>>(STORAGE_KEYS.HRMS, {});

const initialState: HRMSState = {
  profile: savedHRMS.profile || null,
  attendance: savedHRMS.attendance || [],
  leaves: savedHRMS.leaves || [],
  isPunchedIn: savedHRMS.isPunchedIn || false,
  lastPunchTime: savedHRMS.lastPunchTime || null,
  activeView: savedHRMS.activeView || "dashboard",
  loading: false,
};

export const hrmsSlice = createSlice({
  name: "hrms",
  initialState,
  reducers: {
    setHRMSProfile: (state, action: PayloadAction<HRProfileData>) => {
      state.profile = action.payload;
      saveToLocalStorage(STORAGE_KEYS.HRMS, {
        profile: state.profile,
        attendance: state.attendance,
        leaves: state.leaves,
        isPunchedIn: state.isPunchedIn,
        lastPunchTime: state.lastPunchTime,
        activeView: state.activeView,
      });
    },
    setAttendanceList: (state, action: PayloadAction<AttendanceRecord[]>) => {
      state.attendance = action.payload;
      saveToLocalStorage(STORAGE_KEYS.HRMS, {
        profile: state.profile,
        attendance: state.attendance,
        leaves: state.leaves,
        isPunchedIn: state.isPunchedIn,
        lastPunchTime: state.lastPunchTime,
        activeView: state.activeView,
      });
    },
    setLeavesList: (state, action: PayloadAction<LeaveRecord[]>) => {
      state.leaves = action.payload;
      saveToLocalStorage(STORAGE_KEYS.HRMS, {
        profile: state.profile,
        attendance: state.attendance,
        leaves: state.leaves,
        isPunchedIn: state.isPunchedIn,
        lastPunchTime: state.lastPunchTime,
        activeView: state.activeView,
      });
    },
    setPunchStatus: (state, action: PayloadAction<{ isPunchedIn: boolean; lastPunchTime: string | null }>) => {
      state.isPunchedIn = action.payload.isPunchedIn;
      state.lastPunchTime = action.payload.lastPunchTime;
      saveToLocalStorage(STORAGE_KEYS.HRMS, {
        profile: state.profile,
        attendance: state.attendance,
        leaves: state.leaves,
        isPunchedIn: state.isPunchedIn,
        lastPunchTime: state.lastPunchTime,
        activeView: state.activeView,
      });
    },
    setHRMSActiveView: (
      state,
      action: PayloadAction<"dashboard" | "attendance" | "leaves" | "directory" | "reports">
    ) => {
      state.activeView = action.payload;
      saveToLocalStorage(STORAGE_KEYS.HRMS, {
        profile: state.profile,
        attendance: state.attendance,
        leaves: state.leaves,
        isPunchedIn: state.isPunchedIn,
        lastPunchTime: state.lastPunchTime,
        activeView: state.activeView,
      });
    },
    setHRMSLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setHRMSProfile,
  setAttendanceList,
  setLeavesList,
  setPunchStatus,
  setHRMSActiveView,
  setHRMSLoading,
} = hrmsSlice.actions;

export default hrmsSlice.reducer;
