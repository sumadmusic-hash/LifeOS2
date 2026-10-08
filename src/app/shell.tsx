import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useUiStore, useDataStore, useUndoStore } from '../core/state';
import { initDatabase, repos } from '../core/db';
import { Button, Skeleton } from '../core/ui';
import { Home, ListTodo, Target, Repeat, BookOpen, Calendar, Timer, MessageSquare, BarChart3, Briefcase, Tag, User, Settings, Menu, X, Command, Undo2, Sun, Moon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';

// Lazy load modules
const TodayModule = lazy(() => import('../modules/TodayModule'));
const TasksModule = lazy(() => import('../modules/TasksModule'));
const GoalsModule = lazy(() => import('../modules/GoalsModule'));
const HabitsModule = lazy(() => import('../modules/HabitsModule'));
const JournalModule = lazy(() => import('../modules/JournalModule'));
const CalendarModule = lazy(() => import('../modules/CalendarModule'));
const FocusModule = lazy(() => import('../modules/FocusModule'));
const ChatModule = lazy(() => import('../modules/ChatModule'));
const StatsModule = lazy(() => import('../modules/StatsModule'));
const JobBoardModule = lazy(() => import('../modules/JobBoardModule'));
const OffersModule = lazy(() => import('../modules/OffersModule'));
const ProfileModule = lazy(() => import('../modules/ProfileModule'));
const SettingsModule = lazy(() => import('../modules/SettingsModule'));

const MODULES = [
  { id: 'today', label: 'Heute', icon: Home, group: 'Übersicht' },
  { id: 'tasks', label: 'Aufgaben', icon: ListTodo, group: 'Planung' },
  { id: 'goals', label: 'Ziele', icon: Target, group: 'Planung' },
  { id: 'habits', label: 'Gewohnheiten', icon: Repeat, group: 'Planung' },
  { id: 'journal', label: 'Journal', icon: BookOpen, group: 'Reflexion' },
  { id: 'calendar', label: 'Kalender', icon: Calendar, group: 'Planung' },
  { id: 'focus', label: 'Fokus', icon: Timer, group: 'Produktivität' },
  { id: 'chat', label: 'KI-Chat', icon: MessageSquare, group: 'KI' },
  { id: 'stats', label: 'Statistiken', icon: BarChart3, group: 'Analyse' },
  { id: 'jobboard', label: 'Job Board', icon: Briefcase, group: 'Karriere' },
  { id: 'offers', label: 'Angebote', icon: Tag, group: 'Finanzen' },
  { id: 'profile', label: 'Profil', icon: User, group: 'Persönlich' },
  { id: 'settings', label: 'Einstellungen', icon: Settings, group: 'System' },
];

export default function AppShell() {
  const { sidebarCollapsed, toggleSidebar, activeModule, setActiveModule, theme, setTheme, commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const { setTasks, setGoals, setHabits, setHabitLogs, setJournal, setCalendar, setFocusSessions, setJobApplications, setOffers, setProfile, setAiSessions, setSettings, loaded, setLoaded } = useDataStore();
  const undo = useUndoStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize database
  useEffect(() => {
    const loadData = async () => {
      await initDatabase();
      const [tasks, goals, habits, habitLogs, journal, calendar, focusSessions, jobApps, offers, profile, aiSessions, settings] = await Promise.all([
        repos.tasks.getAll(), repos.goals.getAll(), repos.habits.getAll(),
        repos.habitLogs.getAll(), repos.journal.getAll(), repos.calendar.getAll(),
        repos.focusSessions.getAll(), repos.jobApplications.getAll(), repos.offers.getAll(),
        repos.profile.get(), repos.aiSessions.getAll(), repos.settings.get(),
      ]);
      setTasks(tasks); setGoals(goals); setHabits(habits); setHabitLogs(habitLogs);
      setJournal(journal); setCalendar(calendar); setFocusSessions(focusSessions);
      setJobApplications(jobApps); setOffers(offers); setProfile(profile!);
      setAiSessions(aiSessions); setSettings(settings!);
      if (settings?.theme) setTheme(settings.theme);
      setLoaded(true);
    };
    loadData();
  }, []);

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandPaletteOpen(!commandPaletteOpen); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') { e.preventDefault(); setTheme(theme === 'dark' ? 'light' : 'dark'); }
      // Number keys for modules
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          const moduleIndex = parseInt(e.key) - 1;
          if (moduleIndex < MODULES.length) setActiveModule(MODULES[moduleIndex].id);
        }
      }
      if (!e.metaKey && !e.ctrlKey && e.key === 'n') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setActiveModule('tasks');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, theme]);

  const handleUndo = useCallback(async () => {
    const entry = undo.stack[undo.stack.length - 1];
    if (!entry) return;
    
    try {
      const previousState = JSON.parse(entry.previousState);
      switch (entry.entityType) {
        case 'task':
          await repos.tasks.update(entry.entityId, previousState);
          setTasks(await repos.tasks.getAll());
          break;
        case 'goal':
          await repos.goals.update(entry.entityId, previousState);
          setGoals(await repos.goals.getAll());
          break;
      }
      // Remove from stack
      const newStack = [...undo.stack];
      newStack.pop();
      undo.clear();
      newStack.forEach(e => undo.push(e));
    } catch { /* ignore */ }
  }, [undo.stack]);

  const navigateTo = (moduleId: string) => {
    setActiveModule(moduleId);
    setCommandPaletteOpen(false);
    setMobileMenuOpen(false);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-surface)]">
        <div className="text-center">
          <div className="text-4xl mb-3">🧠</div>
          <p className="text-[var(--color-text-secondary)]">LifeOS wird geladen...</p>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    const fallback = <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
    switch (activeModule) {
      case 'today': return <Suspense fallback={fallback}><TodayModule /></Suspense>;
      case 'tasks': return <Suspense fallback={fallback}><TasksModule /></Suspense>;
      case 'goals': return <Suspense fallback={fallback}><GoalsModule /></Suspense>;
      case 'habits': return <Suspense fallback={fallback}><HabitsModule /></Suspense>;
      case 'journal': return <Suspense fallback={fallback}><JournalModule /></Suspense>;
      case 'calendar': return <Suspense fallback={fallback}><CalendarModule /></Suspense>;
      case 'focus': return <Suspense fallback={fallback}><FocusModule /></Suspense>;
      case 'chat': return <Suspense fallback={fallback}><ChatModule /></Suspense>;
      case 'stats': return <Suspense fallback={fallback}><StatsModule /></Suspense>;
      case 'jobboard': return <Suspense fallback={fallback}><JobBoardModule /></Suspense>;
      case 'offers': return <Suspense fallback={fallback}><OffersModule /></Suspense>;
      case 'profile': return <Suspense fallback={fallback}><ProfileModule /></Suspense>;
      case 'settings': return <Suspense fallback={fallback}><SettingsModule /></Suspense>;
      default: return <Suspense fallback={fallback}><TodayModule /></Suspense>;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-surface)] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 border-b border-[var(--color-border)]`}>
          {!sidebarCollapsed && <span className="font-bold text-[var(--color-text)]">🧠 LifeOS</span>}
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] focus-ring" aria-label="Sidebar umschalten">
            <Menu className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <button key={mod.id} onClick={() => navigateTo(mod.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors focus-ring ${activeModule === mod.id ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'}`}
                title={sidebarCollapsed ? mod.label : undefined}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{mod.label}</span>}
                {!sidebarCollapsed && i < 9 && <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">{i + 1}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[var(--color-border)]">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] focus-ring">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Hell' : 'Dunkel'}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 z-40">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] focus-ring">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-bold text-[var(--color-text)]">🧠 LifeOS</span>
        <button onClick={() => setCommandPaletteOpen(true)} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] focus-ring">
          <Command className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-[var(--color-surface)] z-30 overflow-y-auto animate-fade-in">
          <nav className="p-4 space-y-1">
            {MODULES.map(mod => {
              const Icon = mod.icon;
              return (
                <button key={mod.id} onClick={() => navigateTo(mod.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left ${activeModule === mod.id ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{mod.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${activeModule !== 'chat' ? 'pt-0 md:pt-0' : ''} ${activeModule === 'chat' ? '' : 'pt-14 md:pt-0'}`}>
        {renderModule()}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 z-40">
        {[MODULES[0], MODULES[1], MODULES[7], MODULES[3], MODULES[12]].map(mod => {
          const Icon = mod.icon;
          return (
            <button key={mod.id} onClick={() => navigateTo(mod.id)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg ${activeModule === mod.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{mod.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Command Palette */}
      <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} label="Befehlspalette">
        <CommandInput placeholder="Befehl suchen oder eingeben..." />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse.</CommandEmpty>
          <CommandGroup heading="Module">
            {MODULES.map(mod => (
              <CommandItem key={mod.id} onSelect={() => navigateTo(mod.id)}>
                <mod.icon className="w-4 h-4 mr-2" />
                {mod.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Aktionen">
            <CommandItem onSelect={() => { navigateTo('tasks'); }}>Neue Aufgabe erstellen</CommandItem>
            <CommandItem onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}>Theme umschalten</CommandItem>
            <CommandItem onSelect={handleUndo}>Rückgängig</CommandItem>
            <CommandItem onSelect={() => navigateTo('chat')}>KI-Chat öffnen</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Undo Button */}
      {undo.stack.length > 0 && (
        <button onClick={handleUndo} className="fixed bottom-20 md:bottom-4 right-4 p-3 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg hover:bg-[var(--color-surface-hover)] focus-ring z-50 animate-fade-in" aria-label="Rückgängig" title="Rückgängig (⌘Z)">
          <Undo2 className="w-5 h-5 text-[var(--color-text)]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[10px] flex items-center justify-center">{undo.stack.length}</span>
        </button>
      )}

      <Toaster position="bottom-center" toastOptions={{ className: 'text-sm', duration: 2000 }} />
    </div>
  );
}
