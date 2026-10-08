import { useDataStore } from '../core/state';
import { Card, Badge, PriorityDot, ProgressBar, Button, EmptyState } from '../core/ui';
import { CheckCircle2, Circle, Target, Flame, Calendar, ListTodo } from 'lucide-react';

export default function TodayModule() {
  const { tasks, goals, habits, habitLogs, calendar, focusSessions } = useDataStore();
  
  const today = new Date().toISOString().split('T')[0];
  const openTasks = tasks.filter(t => !t.deletedAt && t.status !== 'done' && t.status !== 'cancelled');
  const todayTasks = openTasks.filter(t => t.dueDate === today);
  const overdueTasks = openTasks.filter(t => t.dueDate && t.dueDate < today);
  const todayHabits = habits.filter(h => {
    const log = habitLogs.find(l => l.habitId === h.id && l.date === today);
    return log?.completed;
  });
  const todayEvents = calendar.filter(e => e.start.startsWith(today));
  const activeGoals = goals.filter(g => g.status === 'active');
  const todayFocus = focusSessions.filter(s => s.startedAt.startsWith(today));
  const totalFocusMinutes = todayFocus.reduce((sum, s) => sum + s.duration, 0);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{greeting()} 👋</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="text-center">
          <ListTodo className="w-5 h-5 mx-auto mb-1 text-[var(--color-accent)]" />
          <div className="text-2xl font-bold">{openTasks.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Offene Aufgaben</div>
        </Card>
        <Card className="text-center">
          <Target className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
          <div className="text-2xl font-bold">{activeGoals.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Aktive Ziele</div>
        </Card>
        <Card className="text-center">
          <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <div className="text-2xl font-bold">{todayHabits.length}/{habits.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Heute erledigt</div>
        </Card>
        <Card className="text-center">
          <Calendar className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <div className="text-2xl font-bold">{totalFocusMinutes}m</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Fokus heute</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <ListTodo className="w-4 h-4" /> Heutige Aufgaben
          </h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Keine Aufgaben für heute</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <PriorityDot priority={task.priority} />
                  <span className="truncate flex-1">{task.title}</span>
                  <Badge color={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'default'}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <Card className="border-[var(--color-danger)]/30">
            <h2 className="text-sm font-semibold text-[var(--color-danger)] mb-3">⚠️ Überfällig ({overdueTasks.length})</h2>
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <PriorityDot priority={task.priority} />
                  <span className="truncate flex-1">{task.title}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{task.dueDate}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Habits */}
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4" /> Gewohnheiten heute
          </h2>
          {habits.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Noch keine Gewohnheiten angelegt</p>
          ) : (
            <div className="space-y-2">
              {habits.slice(0, 5).map(habit => {
                const done = habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
                return (
                  <div key={habit.id} className="flex items-center gap-2 text-sm">
                    {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-[var(--color-text-muted)]" />}
                    <span className={done ? 'line-through text-[var(--color-text-muted)]' : ''}>{habit.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Goals Progress */}
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Ziele
          </h2>
          {activeGoals.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Keine aktiven Ziele</p>
          ) : (
            <div className="space-y-3">
              {activeGoals.slice(0, 4).map(goal => (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{goal.title}</span>
                    <span className="text-[var(--color-text-muted)]">{goal.progress}%</span>
                  </div>
                  <ProgressBar value={goal.progress} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Calendar Events */}
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Termine heute
          </h2>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Keine Termine heute</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(event => (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color || 'var(--color-accent)' }} />
                  <span className="truncate flex-1">{event.title}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">⚡ Schnellaktionen</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.location.hash = '#/tasks'}>
              <ListTodo className="w-3 h-3" /> Aufgabe
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.location.hash = '#/focus'}>
              <Calendar className="w-3 h-3" /> Fokus
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.location.hash = '#/journal'}>
              📝 Journal
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.location.hash = '#/chat'}>
              🤖 KI-Chat
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
