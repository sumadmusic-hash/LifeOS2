import Dexie, { type Table } from 'dexie';

// Entity types
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  dueDate?: string;
  tags: string[];
  goalId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  progress: number; // 0-100
  milestones: { id: string; title: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  targetPerWeek?: number;
  goalId?: string;
  createdAt: string;
  archivedAt?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  mood?: number; // 1-5
  note?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: number; // 1-5
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO datetime
  end?: string;
  color?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  taskId?: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // minutes
  type: 'work' | 'break';
  completed: boolean;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  phase: 'research' | 'applied' | 'interview' | 'offer' | 'rejected' | 'closed';
  url?: string;
  notes?: string;
  salary?: string;
  history: { phase: string; date: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  category: string;
  url?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  values: string[];
  energyTimes: { morning: boolean; afternoon: boolean; evening: boolean };
  stressFactors: string[];
  interests: string[];
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: { name: string; args: Record<string, unknown>; result?: string }[];
  tokens?: { prompt: number; completion: number };
  createdAt: string;
}

export interface AiSession {
  id: string;
  title: string;
  messages: AiMessage[];
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface UndoEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState: string; // JSON
  createdAt: string;
}

export interface Settings {
  id: string;
  aiProvider: string;
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string;
  theme: 'light' | 'dark' | 'system';
  language: 'de' | 'en';
  tokenBudget: number;
  rateLimit: number;
  density: 'comfortable' | 'dense';
  sidebarCollapsed: boolean;
}

class LifeOSDatabase extends Dexie {
  tasks!: Table<Task, string>;
  goals!: Table<Goal, string>;
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  journal!: Table<JournalEntry, string>;
  calendar!: Table<CalendarEvent, string>;
  focusSessions!: Table<FocusSession, string>;
  jobApplications!: Table<JobApplication, string>;
  offers!: Table<Offer, string>;
  profile!: Table<UserProfile, string>;
  aiSessions!: Table<AiSession, string>;
  undoStack!: Table<UndoEntry, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('LifeOS2');
    this.version(1).stores({
      tasks: 'id, status, priority, dueDate, goalId, deletedAt, [status+priority]',
      goals: 'id, status',
      habits: 'id, frequency',
      habitLogs: 'id, habitId, date, [habitId+date]',
      journal: 'id, date, mood',
      calendar: 'id, start',
      focusSessions: 'id, taskId, startedAt',
      jobApplications: 'id, phase, company',
      offers: 'id, category, price',
      profile: 'id',
      aiSessions: 'id, createdAt',
      undoStack: 'id, createdAt',
      settings: 'id',
    });
  }
}

export const db = new LifeOSDatabase();

// Repository pattern
export const repos = {
  tasks: {
    getAll: () => db.tasks.filter(t => !t.deletedAt).toArray(),
    getActive: () => db.tasks.filter(t => !t.deletedAt && t.status !== 'done' && t.status !== 'cancelled').toArray(),
    getById: (id: string) => db.tasks.get(id),
    create: (task: Task) => db.tasks.add(task),
    update: (id: string, changes: Partial<Task>) => db.tasks.update(id, changes),
    delete: (id: string) => db.tasks.update(id, { deletedAt: new Date().toISOString() }),
    hardDelete: (id: string) => db.tasks.delete(id),
  },
  goals: {
    getAll: () => db.goals.toArray(),
    getById: (id: string) => db.goals.get(id),
    create: (goal: Goal) => db.goals.add(goal),
    update: (id: string, changes: Partial<Goal>) => db.goals.update(id, changes),
    delete: (id: string) => db.goals.delete(id),
  },
  habits: {
    getAll: () => db.habits.filter(h => !h.archivedAt).toArray(),
    getById: (id: string) => db.habits.get(id),
    create: (habit: Habit) => db.habits.add(habit),
    update: (id: string, changes: Partial<Habit>) => db.habits.update(id, changes),
    archive: (id: string) => db.habits.update(id, { archivedAt: new Date().toISOString() }),
  },
  habitLogs: {
    getAll: () => db.habitLogs.toArray(),
    getByDate: (date: string) => db.habitLogs.where('date').equals(date).toArray(),
    getByHabit: (habitId: string) => db.habitLogs.where('habitId').equals(habitId).toArray(),
    create: (log: HabitLog) => db.habitLogs.add(log),
    update: (id: string, changes: Partial<HabitLog>) => db.habitLogs.update(id, changes),
    delete: (id: string) => db.habitLogs.delete(id),
  },
  journal: {
    getAll: () => db.journal.orderBy('date').reverse().toArray(),
    getById: (id: string) => db.journal.get(id),
    create: (entry: JournalEntry) => db.journal.add(entry),
    update: (id: string, changes: Partial<JournalEntry>) => db.journal.update(id, changes),
    delete: (id: string) => db.journal.delete(id),
  },
  calendar: {
    getAll: () => db.calendar.toArray(),
    getByDateRange: (start: string, end: string) => db.calendar.where('start').between(start, end, true, true).toArray(),
    create: (event: CalendarEvent) => db.calendar.add(event),
    update: (id: string, changes: Partial<CalendarEvent>) => db.calendar.update(id, changes),
    delete: (id: string) => db.calendar.delete(id),
  },
  focusSessions: {
    getAll: () => db.focusSessions.orderBy('startedAt').reverse().toArray(),
    getToday: () => {
      const today = new Date().toISOString().split('T')[0];
      return db.focusSessions.where('startedAt').startsWith(today).toArray();
    },
    create: (session: FocusSession) => db.focusSessions.add(session),
    update: (id: string, changes: Partial<FocusSession>) => db.focusSessions.update(id, changes),
  },
  jobApplications: {
    getAll: () => db.jobApplications.toArray(),
    getById: (id: string) => db.jobApplications.get(id),
    create: (app: JobApplication) => db.jobApplications.add(app),
    update: (id: string, changes: Partial<JobApplication>) => db.jobApplications.update(id, changes),
    delete: (id: string) => db.jobApplications.delete(id),
  },
  offers: {
    getAll: () => db.offers.toArray(),
    create: (offer: Offer) => db.offers.add(offer),
    update: (id: string, changes: Partial<Offer>) => db.offers.update(id, changes),
    delete: (id: string) => db.offers.delete(id),
  },
  profile: {
    get: () => db.profile.get('default'),
    save: (profile: UserProfile) => db.profile.put(profile),
  },
  aiSessions: {
    getAll: () => db.aiSessions.orderBy('createdAt').reverse().toArray(),
    getById: (id: string) => db.aiSessions.get(id),
    create: (session: AiSession) => db.aiSessions.add(session),
    update: (id: string, changes: Partial<AiSession>) => db.aiSessions.update(id, changes),
    delete: (id: string) => db.aiSessions.delete(id),
  },
  undoStack: {
    getAll: () => db.undoStack.orderBy('createdAt').reverse().limit(50).toArray(),
    push: (entry: UndoEntry) => db.undoStack.add(entry),
    pop: () => db.undoStack.orderBy('createdAt').reverse().first().then(async (entry) => {
      if (entry) await db.undoStack.delete(entry.id);
      return entry;
    }),
    clear: () => db.undoStack.clear(),
  },
  settings: {
    get: () => db.settings.get('default'),
    save: (settings: Settings) => db.settings.put(settings),
  },
};

// Initialize default settings
export async function initDatabase() {
  const existingSettings = await db.settings.get('default');
  if (!existingSettings) {
    await db.settings.add({
      id: 'default',
      aiProvider: 'openai',
      aiModel: 'gpt-4o-mini',
      aiApiKey: '',
      aiBaseUrl: '',
      theme: 'system',
      language: 'de',
      tokenBudget: 4000,
      rateLimit: 10,
      density: 'comfortable',
      sidebarCollapsed: false,
    });
  }

  const existingProfile = await db.profile.get('default');
  if (!existingProfile) {
    await db.profile.add({
      id: 'default',
      name: 'User',
      values: [],
      energyTimes: { morning: true, afternoon: true, evening: false },
      stressFactors: [],
      interests: [],
      updatedAt: new Date().toISOString(),
    });
  }
}
