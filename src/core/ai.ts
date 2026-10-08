import { nanoid } from 'nanoid';
import { repos, type Task, type JobApplication, type Settings, type AiMessage } from './db';
import { useDataStore, useAiSessionStore } from './state';

// Tool definition
export interface ToolDefinition {
  name: string;
  description: string; // ≤90 chars for compressed schema
  parameters: Record<string, unknown>;
  permission: 'read' | 'write' | 'destructive';
  module: string;
}

// All 42 tools
export const ALL_TOOLS: ToolDefinition[] = [
  // Navigation & Meta
  { name: 'navigate_to', description: 'Navigate to a module page', parameters: { type: 'object', properties: { module: { type: 'string', enum: ['today','tasks','goals','habits','journal','calendar','focus','chat','stats','jobboard','offers','profile','settings'] } }, required: ['module'] }, permission: 'read', module: 'core' },
  { name: 'search_tools', description: 'Search available tools by query', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, permission: 'read', module: 'core' },
  { name: 'get_current_datetime', description: 'Get current date and time', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'core' },
  { name: 'undo_last', description: 'Undo the last action', parameters: { type: 'object', properties: {} }, permission: 'write', module: 'core' },
  
  // Tasks
  { name: 'list_tasks', description: 'List tasks with optional filters', parameters: { type: 'object', properties: { status: { type: 'string' }, priority: { type: 'string' }, limit: { type: 'number' } } }, permission: 'read', module: 'tasks' },
  { name: 'create_task', description: 'Create a new task', parameters: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'string' }, dueDate: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title'] }, permission: 'write', module: 'tasks' },
  { name: 'update_task', description: 'Update task fields', parameters: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, priority: { type: 'string' }, status: { type: 'string' }, dueDate: { type: 'string' } }, required: ['id'] }, permission: 'write', module: 'tasks' },
  { name: 'complete_task', description: 'Mark task as done', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, permission: 'write', module: 'tasks' },
  { name: 'delete_task', description: 'Soft-delete a task', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, permission: 'destructive', module: 'tasks' },
  
  // Goals
  { name: 'list_goals', description: 'List all goals', parameters: { type: 'object', properties: { status: { type: 'string' } } }, permission: 'read', module: 'goals' },
  { name: 'create_goal', description: 'Create a new goal', parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] }, permission: 'write', module: 'goals' },
  { name: 'update_goal_progress', description: 'Update goal progress', parameters: { type: 'object', properties: { id: { type: 'string' }, progress: { type: 'number' } }, required: ['id', 'progress'] }, permission: 'write', module: 'goals' },
  { name: 'complete_goal', description: 'Mark goal as completed', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, permission: 'write', module: 'goals' },
  { name: 'delete_goal', description: 'Delete a goal', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, permission: 'destructive', module: 'goals' },
  { name: 'breakdown_goal', description: 'Create tasks from goal milestones', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, permission: 'write', module: 'goals' },
  
  // Habits
  { name: 'list_habits', description: 'List active habits', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'habits' },
  { name: 'create_habit', description: 'Create a new habit', parameters: { type: 'object', properties: { name: { type: 'string' }, frequency: { type: 'string' } }, required: ['name'] }, permission: 'write', module: 'habits' },
  { name: 'log_habit', description: 'Log habit completion for a date', parameters: { type: 'object', properties: { habitId: { type: 'string' }, date: { type: 'string' }, mood: { type: 'number' } }, required: ['habitId'] }, permission: 'write', module: 'habits' },
  { name: 'get_habit_streaks', description: 'Get current streaks for habits', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'habits' },
  
  // Journal
  { name: 'create_journal_entry', description: 'Create a journal entry', parameters: { type: 'object', properties: { content: { type: 'string' }, mood: { type: 'number' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['content'] }, permission: 'write', module: 'journal' },
  { name: 'list_journal_entries', description: 'List journal entries', parameters: { type: 'object', properties: { limit: { type: 'number' } } }, permission: 'read', module: 'journal' },
  { name: 'log_mood', description: 'Log current mood (1-5)', parameters: { type: 'object', properties: { mood: { type: 'number' }, note: { type: 'string' } }, required: ['mood'] }, permission: 'write', module: 'journal' },
  
  // Calendar
  { name: 'list_calendar_events', description: 'List calendar events', parameters: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } } }, permission: 'read', module: 'calendar' },
  { name: 'create_calendar_event', description: 'Create a calendar event', parameters: { type: 'object', properties: { title: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, color: { type: 'string' } }, required: ['title', 'start'] }, permission: 'write', module: 'calendar' },
  { name: 'set_reminder', description: 'Set a reminder (creates event)', parameters: { type: 'object', properties: { title: { type: 'string' }, time: { type: 'string' } }, required: ['title', 'time'] }, permission: 'write', module: 'calendar' },
  
  // Focus
  { name: 'focus_start', description: 'Start a focus/pomodoro session', parameters: { type: 'object', properties: { taskId: { type: 'string' }, duration: { type: 'number' } } }, permission: 'write', module: 'focus' },
  { name: 'focus_stop', description: 'Stop current focus session', parameters: { type: 'object', properties: {} }, permission: 'write', module: 'focus' },
  
  // Job Board
  { name: 'list_job_applications', description: 'List job applications', parameters: { type: 'object', properties: { phase: { type: 'string' } } }, permission: 'read', module: 'jobboard' },
  { name: 'create_job_application', description: 'Create a job application', parameters: { type: 'object', properties: { company: { type: 'string' }, position: { type: 'string' }, url: { type: 'string' } }, required: ['company', 'position'] }, permission: 'write', module: 'jobboard' },
  { name: 'update_job_application', description: 'Update a job application', parameters: { type: 'object', properties: { id: { type: 'string' }, notes: { type: 'string' }, salary: { type: 'string' } }, required: ['id'] }, permission: 'write', module: 'jobboard' },
  { name: 'update_job_phase', description: 'Move application to new phase', parameters: { type: 'object', properties: { id: { type: 'string' }, phase: { type: 'string' } }, required: ['id', 'phase'] }, permission: 'write', module: 'jobboard' },
  
  // Offers
  { name: 'offers_list', description: 'List tracked offers', parameters: { type: 'object', properties: { category: { type: 'string' } } }, permission: 'read', module: 'offers' },
  { name: 'offers_add', description: 'Add an offer to track', parameters: { type: 'object', properties: { title: { type: 'string' }, price: { type: 'number' }, category: { type: 'string' }, url: { type: 'string' } }, required: ['title', 'price'] }, permission: 'write', module: 'offers' },
  
  // Profile & Settings
  { name: 'get_user_profile', description: 'Get user profile', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'profile' },
  { name: 'update_user_profile', description: 'Update user profile fields', parameters: { type: 'object', properties: { name: { type: 'string' }, values: { type: 'array', items: { type: 'string' } }, interests: { type: 'array', items: { type: 'string' } } } }, permission: 'write', module: 'profile' },
  { name: 'settings_update', description: 'Update app settings', parameters: { type: 'object', properties: { theme: { type: 'string' }, density: { type: 'string' }, tokenBudget: { type: 'number' } } }, permission: 'write', module: 'settings' },
  
  // Data
  { name: 'data_export', description: 'Export all data as JSON', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'settings' },
  { name: 'data_import', description: 'Import data from JSON', parameters: { type: 'object', properties: { data: { type: 'string' } }, required: ['data'] }, permission: 'destructive', module: 'settings' },
  
  // AI Meta
  { name: 'get_today_summary', description: 'Get today overview summary', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'today' },
  { name: 'plan_day', description: 'Create a daily plan', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'today' },
  { name: 'suggest_next_action', description: 'Suggest next action based on context', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'today' },
  { name: 'generate_weekly_review', description: 'Generate weekly review summary', parameters: { type: 'object', properties: {} }, permission: 'read', module: 'stats' },
  { name: 'detect_patterns', description: 'Detect patterns in data', parameters: { type: 'object', properties: { type: { type: 'string' } } }, permission: 'read', module: 'stats' },
  { name: 'get_statistics', description: 'Get productivity statistics', parameters: { type: 'object', properties: { period: { type: 'string' } } }, permission: 'read', module: 'stats' },
  { name: 'search_all', description: 'Search across all entities', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, permission: 'read', module: 'core' },
  { name: 'import_from_text', description: 'Parse text and create entities', parameters: { type: 'object', properties: { text: { type: 'string' }, type: { type: 'string' } }, required: ['text'] }, permission: 'write', module: 'core' },
];

// Lazy tool discovery - only send minimal set by default
const DEFAULT_TOOLS = ['search_tools', 'get_current_datetime', 'navigate_to', 'undo_last', 'get_today_summary', 'suggest_next_action', 'search_all'];

export function getToolsForRequest(userMessage: string): ToolDefinition[] {
  // Heuristic: detect intent and include relevant tools
  const msg = userMessage.toLowerCase();
  const tools = [...DEFAULT_TOOLS];
  
  if (msg.match(/aufgab|task|erledig|todo|mach/)) tools.push('list_tasks', 'create_task', 'complete_task', 'update_task', 'delete_task');
  if (msg.match(/ziel|goal|meilenstein/)) tools.push('list_goals', 'create_goal', 'update_goal_progress', 'complete_goal', 'breakdown_goal');
  if (msg.match(/gewohnheit|habit|streak|routine/)) tools.push('list_habits', 'create_habit', 'log_habit', 'get_habit_streaks');
  if (msg.match(/journal|tagebuch|stimmung|mood|eintrag/)) tools.push('create_journal_entry', 'list_journal_entries', 'log_mood');
  if (msg.match(/kalender|termin|event|erinnerung|reminder/)) tools.push('list_calendar_events', 'create_calendar_event', 'set_reminder');
  if (msg.match(/fokus|pomodoro|konzentr|arbeit/)) tools.push('focus_start', 'focus_stop');
  if (msg.match(/bewerb|job|stelle|interview/)) tools.push('list_job_applications', 'create_job_application', 'update_job_phase');
  if (msg.match(/angebot|preis|offer|deal/)) tools.push('offers_list', 'offers_add');
  if (msg.match(/profil|einstellung|setting|theme/)) tools.push('get_user_profile', 'update_user_profile', 'settings_update');
  if (msg.match(/statistik|review|woche|pattern|muster/)) tools.push('get_statistics', 'generate_weekly_review', 'detect_patterns');
  if (msg.match(/export|import|daten|backup/)) tools.push('data_export', 'data_import');
  if (msg.match(/plan|today|heute|überblick/)) tools.push('get_today_summary', 'plan_day');
  
  return ALL_TOOLS.filter(t => tools.includes(t.name));
}

// Tool search for lazy discovery
export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase();
  return ALL_TOOLS.filter(t => 
    t.name.includes(q) || t.description.toLowerCase().includes(q) || t.module.includes(q)
  ).slice(0, 6);
}

// System prompt - compact dashboard style
const SYSTEM_PROMPT = `Du bist LifeOS, ein persönlicher KI-Assistent. Du hilfst bei Aufgaben, Zielen, Gewohnheiten, Zeitmanagement und Reflexion.
Regeln: Antworte kurz & direkt (≤3 Sätze). Nutze Tools für Aktionen. Bestätige Erfolge kompakt. Bei "search_tools" zuerst Tools suchen.
Aktive Module: Heute, Aufgaben, Ziele, Gewohnheiten, Journal, Kalender, Fokus, JobBoard, Angebote, Profil, Statistiken.`;

// Tool execution
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const store = useDataStore.getState();
  
  switch (name) {
    case 'get_current_datetime':
      return JSON.stringify({ datetime: new Date().toISOString(), date: new Date().toLocaleDateString('de-DE'), time: new Date().toLocaleTimeString('de-DE') });
    
    case 'navigate_to':
      return JSON.stringify({ navigated: args.module });
    
    case 'search_tools': {
      const results = searchTools(args.query as string);
      return JSON.stringify(results.map(t => ({ name: t.name, description: t.description, module: t.module })));
    }
    
    case 'list_tasks': {
      let tasks = store.tasks.filter(t => !t.deletedAt);
      if (args.status) tasks = tasks.filter(t => t.status === args.status);
      if (args.priority) tasks = tasks.filter(t => t.priority === args.priority);
      if (args.limit) tasks = tasks.slice(0, args.limit as number);
      return JSON.stringify(tasks.map(t => `${t.id}|${t.title}|${t.priority}|${t.status}|${t.dueDate || ''}`));
    }
    
    case 'create_task': {
      const task: Task = {
        id: nanoid(), title: args.title as string, priority: (args.priority as Task['priority']) || 'medium',
        status: 'todo', tags: (args.tags as string[]) || [], dueDate: args.dueDate as string,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await repos.tasks.create(task);
      const tasks = await repos.tasks.getAll();
      useDataStore.getState().setTasks(tasks);
      return JSON.stringify({ created: task.id, title: task.title });
    }
    
    case 'complete_task': {
      const existing = await repos.tasks.getById(args.id as string);
      if (!existing) return JSON.stringify({ error: 'Task not found' });
      await repos.tasks.update(args.id as string, { status: 'done', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      const tasks = await repos.tasks.getAll();
      useDataStore.getState().setTasks(tasks);
      return JSON.stringify({ completed: args.id, title: existing.title });
    }
    
    case 'update_task': {
      const existing = await repos.tasks.getById(args.id as string);
      if (!existing) return JSON.stringify({ error: 'Task not found' });
      const changes: Partial<typeof existing> = { updatedAt: new Date().toISOString() };
      if (args.title) changes.title = args.title as string;
      if (args.priority) changes.priority = args.priority as Task['priority'];
      if (args.status) changes.status = args.status as Task['status'];
      if (args.dueDate) changes.dueDate = args.dueDate as string;
      await repos.tasks.update(args.id as string, changes);
      const tasks = await repos.tasks.getAll();
      useDataStore.getState().setTasks(tasks);
      return JSON.stringify({ updated: args.id });
    }
    
    case 'delete_task': {
      const existing = await repos.tasks.getById(args.id as string);
      if (!existing) return JSON.stringify({ error: 'Task not found' });
      await repos.tasks.delete(args.id as string);
      const tasks = await repos.tasks.getAll();
      useDataStore.getState().setTasks(tasks);
      return JSON.stringify({ deleted: args.id, title: existing.title });
    }
    
    case 'list_goals': {
      let goals = store.goals;
      if (args.status) goals = goals.filter(g => g.status === args.status);
      return JSON.stringify(goals.map(g => `${g.id}|${g.title}|${g.status}|${g.progress}%`));
    }
    
    case 'create_goal': {
      const goal = {
        id: nanoid(), title: args.title as string, description: args.description as string || '',
        status: 'active' as const, progress: 0, milestones: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await repos.goals.create(goal);
      const goals = await repos.goals.getAll();
      useDataStore.getState().setGoals(goals);
      return JSON.stringify({ created: goal.id, title: goal.title });
    }
    
    case 'update_goal_progress': {
      await repos.goals.update(args.id as string, { progress: args.progress as number, updatedAt: new Date().toISOString() });
      const goals = await repos.goals.getAll();
      useDataStore.getState().setGoals(goals);
      return JSON.stringify({ updated: args.id, progress: args.progress });
    }
    
    case 'complete_goal': {
      await repos.goals.update(args.id as string, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      const goals = await repos.goals.getAll();
      useDataStore.getState().setGoals(goals);
      return JSON.stringify({ completed: args.id });
    }
    
    case 'delete_goal': {
      await repos.goals.delete(args.id as string);
      const goals = await repos.goals.getAll();
      useDataStore.getState().setGoals(goals);
      return JSON.stringify({ deleted: args.id });
    }
    
    case 'breakdown_goal': {
      const goal = await repos.goals.getById(args.id as string);
      if (!goal) return JSON.stringify({ error: 'Goal not found' });
      const tasks = goal.milestones.map(m => ({
        id: nanoid(), title: `${goal.title}: ${m.title}`, priority: 'medium' as const,
        status: 'todo' as const, tags: ['goal'], goalId: goal.id,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }));
      for (const t of tasks) await repos.tasks.create(t);
      const allTasks = await repos.tasks.getAll();
      useDataStore.getState().setTasks(allTasks);
      return JSON.stringify({ created_tasks: tasks.length, goal: goal.title });
    }
    
    case 'list_habits': {
      return JSON.stringify(store.habits.map(h => `${h.id}|${h.name}|${h.frequency}`));
    }
    
    case 'create_habit': {
      const habit = {
        id: nanoid(), name: args.name as string, frequency: (args.frequency as 'daily' | 'weekly') || 'daily',
        createdAt: new Date().toISOString(),
      };
      await repos.habits.create(habit);
      const habits = await repos.habits.getAll();
      useDataStore.getState().setHabits(habits);
      return JSON.stringify({ created: habit.id, name: habit.name });
    }
    
    case 'log_habit': {
      const date = (args.date as string) || new Date().toISOString().split('T')[0];
      const log = {
        id: nanoid(), habitId: args.habitId as string, date,
        completed: true, mood: args.mood as number,
      };
      await repos.habitLogs.create(log);
      const logs = await repos.habitLogs.getByDate(date);
      useDataStore.getState().setHabitLogs([...store.habitLogs.filter(l => l.date !== date || l.habitId !== args.habitId), log]);
      return JSON.stringify({ logged: log.habitId, date: log.date });
    }
    
    case 'get_habit_streaks': {
      const streaks = store.habits.map(h => {
        const logs = store.habitLogs.filter(l => l.habitId === h.id && l.completed).sort((a, b) => b.date.localeCompare(a.date));
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          const ds = d.toISOString().split('T')[0];
          if (logs.some(l => l.date === ds)) streak++;
          else if (i > 0) break;
        }
        return { habit: h.name, streak };
      });
      return JSON.stringify(streaks);
    }
    
    case 'create_journal_entry': {
      const entry = {
        id: nanoid(), date: new Date().toISOString().split('T')[0],
        content: args.content as string, mood: (args.mood as number) || 3,
        tags: (args.tags as string[]) || [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await repos.journal.create(entry);
      const journal = await repos.journal.getAll();
      useDataStore.getState().setJournal(journal);
      return JSON.stringify({ created: entry.id, date: entry.date });
    }
    
    case 'list_journal_entries': {
      const entries = store.journal.slice(0, (args.limit as number) || 10);
      return JSON.stringify(entries.map(e => `${e.id}|${e.date}|mood:${e.mood}|${e.content.slice(0, 80)}`));
    }
    
    case 'log_mood': {
      const entry = {
        id: nanoid(), date: new Date().toISOString().split('T')[0],
        content: args.note as string || `Stimmung: ${args.mood}/5`,
        mood: args.mood as number, tags: ['mood'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await repos.journal.create(entry);
      const journal = await repos.journal.getAll();
      useDataStore.getState().setJournal(journal);
      return JSON.stringify({ logged: args.mood });
    }
    
    case 'list_calendar_events': {
      let events = store.calendar;
      if (args.from) events = events.filter(e => e.start >= (args.from as string));
      if (args.to) events = events.filter(e => e.start <= (args.to as string));
      return JSON.stringify(events.map(e => `${e.id}|${e.title}|${e.start}`));
    }
    
    case 'create_calendar_event': {
      const event = {
        id: nanoid(), title: args.title as string, start: args.start as string,
        end: args.end as string, color: args.color as string,
        createdAt: new Date().toISOString(),
      };
      await repos.calendar.create(event);
      const calendar = await repos.calendar.getAll();
      useDataStore.getState().setCalendar(calendar);
      return JSON.stringify({ created: event.id, title: event.title });
    }
    
    case 'set_reminder': {
      const event = {
        id: nanoid(), title: `⏰ ${args.title}`, start: args.time as string,
        createdAt: new Date().toISOString(),
      };
      await repos.calendar.create(event);
      const calendar = await repos.calendar.getAll();
      useDataStore.getState().setCalendar(calendar);
      return JSON.stringify({ reminder_set: event.id, time: event.start });
    }
    
    case 'focus_start': {
      const session = {
        id: nanoid(), taskId: args.taskId as string,
        startedAt: new Date().toISOString(), duration: (args.duration as number) || 25,
        type: 'work' as const, completed: false,
      };
      await repos.focusSessions.create(session);
      const sessions = await repos.focusSessions.getAll();
      useDataStore.getState().setFocusSessions(sessions);
      return JSON.stringify({ started: session.id, duration: session.duration });
    }
    
    case 'focus_stop': {
      const active = store.focusSessions.find(s => !s.endedAt);
      if (!active) return JSON.stringify({ error: 'No active session' });
      const endedAt = new Date().toISOString();
      const duration = Math.round((new Date(endedAt).getTime() - new Date(active.startedAt).getTime()) / 60000);
      await repos.focusSessions.update(active.id, { endedAt, duration, completed: true });
      const sessions = await repos.focusSessions.getAll();
      useDataStore.getState().setFocusSessions(sessions);
      return JSON.stringify({ stopped: active.id, duration });
    }
    
    case 'list_job_applications': {
      let apps = store.jobApplications;
      if (args.phase) apps = apps.filter(a => a.phase === args.phase);
      return JSON.stringify(apps.map(a => `${a.id}|${a.company}|${a.position}|${a.phase}`));
    }
    
    case 'create_job_application': {
      const app = {
        id: nanoid(), company: args.company as string, position: args.position as string,
        phase: 'research' as const, url: args.url as string, notes: '',
        history: [{ phase: 'research', date: new Date().toISOString() }],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await repos.jobApplications.create(app);
      const apps = await repos.jobApplications.getAll();
      useDataStore.getState().setJobApplications(apps);
      return JSON.stringify({ created: app.id, company: app.company });
    }
    
    case 'update_job_application': {
      const changes: Partial<JobApplication> = { updatedAt: new Date().toISOString() };
      if (args.notes) changes.notes = args.notes as string;
      if (args.salary) changes.salary = args.salary as string;
      await repos.jobApplications.update(args.id as string, changes);
      const apps = await repos.jobApplications.getAll();
      useDataStore.getState().setJobApplications(apps);
      return JSON.stringify({ updated: args.id });
    }
    
    case 'update_job_phase': {
      const existing = await repos.jobApplications.getById(args.id as string);
      if (!existing) return JSON.stringify({ error: 'Application not found' });
      const newPhase = args.phase as string;
      existing.history.push({ phase: newPhase, date: new Date().toISOString() });
      await repos.jobApplications.update(args.id as string, { phase: newPhase as JobApplication['phase'], history: existing.history, updatedAt: new Date().toISOString() });
      const apps = await repos.jobApplications.getAll();
      useDataStore.getState().setJobApplications(apps);
      return JSON.stringify({ updated: args.id, phase: newPhase });
    }
    
    case 'offers_list': {
      let offers = store.offers;
      if (args.category) offers = offers.filter(o => o.category === args.category);
      return JSON.stringify(offers.map(o => `${o.id}|${o.title}|${o.price}${o.currency}|${o.category}`));
    }
    
    case 'offers_add': {
      const offer = {
        id: nanoid(), title: args.title as string, price: args.price as number,
        currency: 'EUR', category: (args.category as string) || 'sonstiges',
        url: args.url as string, createdAt: new Date().toISOString(),
      };
      await repos.offers.create(offer);
      const offers = await repos.offers.getAll();
      useDataStore.getState().setOffers(offers);
      return JSON.stringify({ added: offer.id, title: offer.title });
    }
    
    case 'get_user_profile': {
      const profile = store.profile;
      return JSON.stringify(profile || { name: 'User', values: [], interests: [] });
    }
    
    case 'update_user_profile': {
      const current = store.profile || { id: 'default', name: 'User', values: [], energyTimes: { morning: true, afternoon: true, evening: false }, stressFactors: [], interests: [], updatedAt: '' };
      const updated = { ...current, updatedAt: new Date().toISOString() };
      if (args.name) updated.name = args.name as string;
      if (args.values) updated.values = args.values as string[];
      if (args.interests) updated.interests = args.interests as string[];
      await repos.profile.save(updated);
      useDataStore.getState().setProfile(updated);
      return JSON.stringify({ updated: true });
    }
    
    case 'settings_update': {
      const current = store.settings;
      if (!current) return JSON.stringify({ error: 'No settings' });
      const updated = { ...current };
      if (args.theme) updated.theme = args.theme as Settings['theme'];
      if (args.density) updated.density = args.density as Settings['density'];
      if (args.tokenBudget) updated.tokenBudget = args.tokenBudget as number;
      await repos.settings.save(updated);
      useDataStore.getState().setSettings(updated);
      return JSON.stringify({ updated: true });
    }
    
    case 'get_today_summary': {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = store.tasks.filter(t => !t.deletedAt && (t.dueDate === today || (t.status !== 'done' && t.status !== 'cancelled')));
      const todayHabits = store.habitLogs.filter(l => l.date === today && l.completed);
      const todayEvents = store.calendar.filter(e => e.start.startsWith(today));
      return JSON.stringify({
        tasks_due: todayTasks.length,
        tasks_open: store.tasks.filter(t => !t.deletedAt && t.status === 'todo').length,
        habits_done: todayHabits.length,
        habits_total: store.habits.length,
        events_today: todayEvents.length,
      });
    }
    
    case 'plan_day': {
      const today = new Date().toISOString().split('T')[0];
      const tasks = store.tasks.filter(t => !t.deletedAt && t.status === 'todo').sort((a, b) => {
        const p = { urgent: 0, high: 1, medium: 2, low: 3 };
        return p[a.priority] - p[b.priority];
      }).slice(0, 5);
      return JSON.stringify({ plan: tasks.map(t => t.title), date: today });
    }
    
    case 'suggest_next_action': {
      const urgent = store.tasks.find(t => !t.deletedAt && t.priority === 'urgent' && t.status === 'todo');
      if (urgent) return JSON.stringify({ suggestion: `Erledige: ${urgent.title}`, type: 'task' });
      const overdue = store.tasks.find(t => !t.deletedAt && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status === 'todo');
      if (overdue) return JSON.stringify({ suggestion: `Überfällig: ${overdue.title}`, type: 'overdue' });
      return JSON.stringify({ suggestion: 'Keine dringenden Aufgaben. Arbeite an deinen Zielen.', type: 'general' });
    }
    
    case 'generate_weekly_review': {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const completedTasks = store.tasks.filter(t => t.completedAt && new Date(t.completedAt) > weekAgo);
      const journalEntries = store.journal.filter(e => new Date(e.date) > weekAgo);
      const avgMood = journalEntries.length > 0 ? journalEntries.reduce((s, e) => s + e.mood, 0) / journalEntries.length : 0;
      return JSON.stringify({ tasks_completed: completedTasks.length, journal_entries: journalEntries.length, avg_mood: avgMood.toFixed(1) });
    }
    
    case 'detect_patterns': {
      const moods = store.journal.map(e => ({ date: e.date, mood: e.mood }));
      const completions = store.tasks.filter(t => t.completedAt).length;
      const total = store.tasks.filter(t => !t.deletedAt).length;
      return JSON.stringify({ completion_rate: total > 0 ? ((completions / total) * 100).toFixed(0) + '%' : 'N/A', mood_entries: moods.length });
    }
    
    case 'get_statistics': {
      const total = store.tasks.filter(t => !t.deletedAt).length;
      const done = store.tasks.filter(t => t.status === 'done').length;
      const habitLogs = store.habitLogs.filter(l => l.completed).length;
      const focusMinutes = store.focusSessions.reduce((s, f) => s + f.duration, 0);
      return JSON.stringify({ tasks_total: total, tasks_done: done, completion_rate: total > 0 ? ((done / total) * 100).toFixed(0) + '%' : 'N/A', habit_completions: habitLogs, focus_minutes: focusMinutes });
    }
    
    case 'search_all': {
      const q = (args.query as string).toLowerCase();
      const results = {
        tasks: store.tasks.filter(t => !t.deletedAt && t.title.toLowerCase().includes(q)).slice(0, 5),
        goals: store.goals.filter(g => g.title.toLowerCase().includes(q)).slice(0, 5),
        journal: store.journal.filter(e => e.content.toLowerCase().includes(q)).slice(0, 5),
      };
      return JSON.stringify({ tasks: results.tasks.map(t => t.title), goals: results.goals.map(g => g.title), journal: results.journal.map(e => e.content.slice(0, 60)) });
    }
    
    case 'data_export': {
      const data = { tasks: store.tasks, goals: store.goals, habits: store.habits, habitLogs: store.habitLogs, journal: store.journal, calendar: store.calendar, focusSessions: store.focusSessions, jobApplications: store.jobApplications, offers: store.offers, profile: store.profile };
      return JSON.stringify(data);
    }
    
    case 'data_import': {
      try {
        const data = JSON.parse(args.data as string);
        if (data.tasks) { await db.tasks.clear(); await db.tasks.bulkAdd(data.tasks); }
        if (data.goals) { await db.goals.clear(); await db.goals.bulkAdd(data.goals); }
        return JSON.stringify({ imported: true });
      } catch { return JSON.stringify({ error: 'Invalid JSON' }); }
    }
    
    case 'import_from_text': {
      const text = args.text as string;
      const lines = text.split('\n').filter(l => l.trim());
      const created: string[] = [];
      for (const line of lines) {
        const task = { id: nanoid(), title: line.trim(), priority: 'medium' as const, status: 'todo' as const, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        await repos.tasks.create(task);
        created.push(task.title);
      }
      const tasks = await repos.tasks.getAll();
      useDataStore.getState().setTasks(tasks);
      return JSON.stringify({ created_tasks: created.length, items: created });
    }
    
    case 'undo_last': {
      return JSON.stringify({ message: 'Use ⌘Z or the undo button in the UI' });
    }
    
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// AI Provider adapter
export interface AiProvider {
  stream(messages: AiMessage[], tools: ToolDefinition[], signal: AbortSignal): AsyncGenerator<{ type: 'text' | 'tool_call' | 'done'; content?: string; toolCall?: { name: string; args: Record<string, unknown> }; usage?: { prompt: number; completion: number } }>;
}

// OpenAI-compatible provider
class OpenAIProvider implements AiProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.model = model;
  }

  async *stream(messages: AiMessage[], tools: ToolDefinition[], signal: AbortSignal) {
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters }
      })),
      stream: true,
      temperature: 0.7,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      yield { type: 'text' as const, content: `Fehler: ${response.status} - ${err}` };
      yield { type: 'done' as const };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta;
            if (delta?.content) {
              yield { type: 'text' as const, content: delta.content };
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) {
                  yield { type: 'tool_call' as const, toolCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments || '{}') } };
                }
              }
            }
            if (json.usage) {
              yield { type: 'done' as const, usage: { prompt: json.usage.prompt_tokens, completion: json.usage.completion_tokens } };
            }
          } catch { /* skip */ }
        }
      }
    }
    yield { type: 'done' as const };
  }
}

// Simulated provider for when no API key is set
class SimulatedProvider implements AiProvider {
  async *stream(messages: AiMessage[], _tools: ToolDefinition[], _signal: AbortSignal) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const lower = lastMsg.toLowerCase();
    
    // Simulate intelligent responses
    await new Promise(r => setTimeout(r, 300));
    
    if (lower.includes('hallo') || lower.includes('hi') || lower.includes('hey')) {
      yield { type: 'text' as const, content: 'Hallo! 👋 Ich bin dein LifeOS-Assistent. Wie kann ich dir heute helfen?' };
    } else if (lower.includes('aufgabe') && (lower.includes('erstelle') || lower.includes('neu') || lower.includes('mach'))) {
      yield { type: 'text' as const, content: 'Ich erstelle eine neue Aufgabe für dich.' };
      yield { type: 'tool_call' as const, toolCall: { name: 'create_task', args: { title: lastMsg.replace(/.*(aufgabe|task|neu|erstelle|mach)\s*/i, '').trim() || 'Neue Aufgabe', priority: 'medium' } } };
    } else if (lower.includes('zusammenfassung') || lower.includes('überblick') || lower.includes('heute')) {
      yield { type: 'tool_call' as const, toolCall: { name: 'get_today_summary', args: {} } };
    } else if (lower.includes('habit') || lower.includes('gewohnheit')) {
      yield { type: 'tool_call' as const, toolCall: { name: 'list_habits', args: {} } };
    } else if (lower.includes('stimmung') || lower.includes('mood')) {
      yield { type: 'tool_call' as const, toolCall: { name: 'log_mood', args: { mood: 4 } } };
    } else {
      yield { type: 'text' as const, content: 'Ich verstehe deine Anfrage. In der Demo-Version bin ich auf simulierte Antworten beschränkt. Konfiguriere einen API-Key in den Einstellungen für volle KI-Funktionalität.' };
    }
    
    yield { type: 'done' as const, usage: { prompt: 150, completion: 50 } };
  }
}

export function createProvider(settings: { provider: string; apiKey: string; baseUrl: string; model: string }): AiProvider {
  if (!settings.apiKey) return new SimulatedProvider();
  return new OpenAIProvider(settings.apiKey, settings.baseUrl, settings.model);
}

// Import db for data_import
import { db } from './db';
