import { create } from 'zustand';
import type { Task, Goal, Habit, HabitLog, JournalEntry, CalendarEvent, FocusSession, JobApplication, Offer, UserProfile, AiSession, Settings } from './db';

// UI Store
interface UiState {
  sidebarCollapsed: boolean;
  activeModule: string;
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'dense';
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setActiveModule: (module: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDensity: (density: 'comfortable' | 'dense') => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  activeModule: 'today',
  theme: 'system',
  density: 'comfortable',
  commandPaletteOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveModule: (module) => set({ activeModule: module }),
  setTheme: (theme) => set({ theme }),
  setDensity: (density) => set({ density }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));

// Data Store (synced with DB)
interface DataState {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  journal: JournalEntry[];
  calendar: CalendarEvent[];
  focusSessions: FocusSession[];
  jobApplications: JobApplication[];
  offers: Offer[];
  profile: UserProfile | null;
  aiSessions: AiSession[];
  settings: Settings | null;
  loaded: boolean;
  setTasks: (tasks: Task[]) => void;
  setGoals: (goals: Goal[]) => void;
  setHabits: (habits: Habit[]) => void;
  setHabitLogs: (logs: HabitLog[]) => void;
  setJournal: (entries: JournalEntry[]) => void;
  setCalendar: (events: CalendarEvent[]) => void;
  setFocusSessions: (sessions: FocusSession[]) => void;
  setJobApplications: (apps: JobApplication[]) => void;
  setOffers: (offers: Offer[]) => void;
  setProfile: (profile: UserProfile) => void;
  setAiSessions: (sessions: AiSession[]) => void;
  setSettings: (settings: Settings) => void;
  setLoaded: (loaded: boolean) => void;
}

export const useDataStore = create<DataState>((set) => ({
  tasks: [],
  goals: [],
  habits: [],
  habitLogs: [],
  journal: [],
  calendar: [],
  focusSessions: [],
  jobApplications: [],
  offers: [],
  profile: null,
  aiSessions: [],
  settings: null,
  loaded: false,
  setTasks: (tasks) => set({ tasks }),
  setGoals: (goals) => set({ goals }),
  setHabits: (habits) => set({ habits }),
  setHabitLogs: (logs) => set({ habitLogs: logs }),
  setJournal: (entries) => set({ journal: entries }),
  setCalendar: (events) => set({ calendar: events }),
  setFocusSessions: (sessions) => set({ focusSessions: sessions }),
  setJobApplications: (apps) => set({ jobApplications: apps }),
  setOffers: (offers) => set({ offers }),
  setProfile: (profile) => set({ profile }),
  setAiSessions: (sessions) => set({ aiSessions: sessions }),
  setSettings: (settings) => set({ settings }),
  setLoaded: (loaded) => set({ loaded }),
}));

// Undo Store
interface UndoState {
  stack: { action: string; entityType: string; entityId: string; previousState: string; timestamp: number }[];
  push: (entry: { action: string; entityType: string; entityId: string; previousState: string }) => void;
  pop: () => { action: string; entityType: string; entityId: string; previousState: string } | undefined;
  clear: () => void;
}

export const useUndoStore = create<UndoState>((set) => ({
  stack: [],
  push: (entry) => set((s) => ({ stack: [...s.stack.slice(-49), { ...entry, timestamp: Date.now() }] })),
  pop: () => {
    let result: { action: string; entityType: string; entityId: string; previousState: string } | undefined;
    set((s) => {
      const newStack = [...s.stack];
      result = newStack.pop();
      return { stack: newStack };
    });
    return result;
  },
  clear: () => set({ stack: [] }),
}));

// AI Session Store
interface AiSessionState {
  currentSessionId: string | null;
  isStreaming: boolean;
  abortController: AbortController | null;
  setCurrentSession: (id: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
}

export const useAiSessionStore = create<AiSessionState>((set) => ({
  currentSessionId: null,
  isStreaming: false,
  abortController: null,
  setCurrentSession: (id) => set({ currentSessionId: id }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setAbortController: (controller) => set({ abortController: controller }),
}));
