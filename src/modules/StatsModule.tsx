import { useDataStore } from '../core/state';
import { Card, Badge } from '../core/ui';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, CheckCircle, Target, Flame } from 'lucide-react';

export default function StatsModule() {
  const { tasks, goals, habits, habitLogs, journal, focusSessions } = useDataStore();

  // Task completion data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const completed = tasks.filter(t => t.completedAt && t.completedAt.startsWith(dateStr)).length;
    return { day: d.toLocaleDateString('de-DE', { weekday: 'short' }), completed };
  });

  // Mood data
  const moodData = journal.slice(0, 14).reverse().map(e => ({
    date: new Date(e.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
    mood: e.mood,
  }));

  // Task status distribution
  const statusData = [
    { name: 'Offen', value: tasks.filter(t => !t.deletedAt && t.status === 'todo').length, color: '#f59e0b' },
    { name: 'In Arbeit', value: tasks.filter(t => !t.deletedAt && t.status === 'in_progress').length, color: '#6366f1' },
    { name: 'Erledigt', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
    { name: 'Abgebrochen', value: tasks.filter(t => t.status === 'cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Focus data
  const focusData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const minutes = focusSessions.filter(s => s.startedAt.startsWith(dateStr) && s.completed).reduce((sum, s) => sum + s.duration, 0);
    return { day: d.toLocaleDateString('de-DE', { weekday: 'short' }), minutes };
  });

  // Overall stats
  const totalTasks = tasks.filter(t => !t.deletedAt).length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const totalFocusMinutes = focusSessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <h1 className="text-xl font-bold text-[var(--color-text)] mb-6">Statistiken</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="text-center">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
          <div className="text-2xl font-bold">{completionRate}%</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Abschlussrate</div>
        </Card>
        <Card className="text-center">
          <Target className="w-5 h-5 mx-auto mb-1 text-[var(--color-accent)]" />
          <div className="text-2xl font-bold">{activeGoals}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Aktive Ziele</div>
        </Card>
        <Card className="text-center">
          <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <div className="text-2xl font-bold">{habits.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Gewohnheiten</div>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <div className="text-2xl font-bold">{totalFocusMinutes}m</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Fokus gesamt</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Task Completion Chart */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Aufgaben (letzte 7 Tage)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Mood Chart */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Stimmungsverlauf</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Status Pie */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Aufgaben-Status</h3>
          <div className="h-48 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Keine Daten</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Focus Chart */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Fokus-Zeit (Minuten)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
