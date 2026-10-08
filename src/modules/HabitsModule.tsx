import { useState } from 'react';
import { useDataStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, Badge, EmptyState, Modal } from '../core/ui';
import { Plus, Check, Flame } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { Habit } from '../core/db';

export default function HabitsModule() {
  const { habits, habitLogs, setHabits, setHabitLogs } = useDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly'>('daily');

  const today = new Date().toISOString().split('T')[0];
  
  // Calculate streaks
  const getStreak = (habitId: string) => {
    const logs = habitLogs.filter(l => l.habitId === habitId && l.completed).sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().split('T')[0];
      if (logs.some(l => l.date === ds)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  };

  const addHabit = async () => {
    if (!newName.trim()) return;
    const habit: Habit = { id: nanoid(), name: newName.trim(), frequency: newFreq, createdAt: new Date().toISOString() };
    await repos.habits.create(habit);
    const all = await repos.habits.getAll();
    setHabits(all);
    setNewName(''); setShowAdd(false);
    toast.success('Gewohnheit erstellt');
  };

  const toggleHabit = async (habitId: string) => {
    const existing = habitLogs.find(l => l.habitId === habitId && l.date === today);
    if (existing) {
      await repos.habitLogs.delete(existing.id);
    } else {
      await repos.habitLogs.create({ id: nanoid(), habitId, date: today, completed: true });
    }
    const allLogs = await repos.habitLogs.getByDate(today);
    const allLogsAll = await Promise.all(habits.map(h => repos.habitLogs.getByHabit(h.id)));
    setHabitLogs(allLogsAll.flat());
    if (!existing) toast.success('✓ Erledigt');
  };

  // Last 7 days visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Gewohnheiten</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" /> Neue Gewohnheit</Button>
      </div>

      {/* Week overview */}
      <div className="flex gap-1 mb-4 justify-end">
        {last7Days.map(d => (
          <div key={d} className="text-center">
            <div className="text-[10px] text-[var(--color-text-muted)]">{new Date(d).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}</div>
            <div className={`w-6 h-6 rounded text-[10px] flex items-center justify-center ${d === today ? 'ring-2 ring-[var(--color-accent)]' : ''} bg-[var(--color-surface-alt)]`}>
              {new Date(d).getDate()}
            </div>
          </div>
        ))}
      </div>

      {habits.length === 0 ? (
        <EmptyState icon="🔄" title="Keine Gewohnheiten" description="Baue positive Routinen auf und tracke deinen Fortschritt." action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-3 h-3" /> Gewohnheit hinzufügen</Button>} />
      ) : (
        <div className="space-y-2">
          {habits.map(habit => {
            const doneToday = habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
            const streak = getStreak(habit.id);
            return (
              <Card key={habit.id} className="flex items-center gap-3 py-3 px-4">
                <button onClick={() => toggleHabit(habit.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors focus-ring ${doneToday ? 'bg-emerald-500 text-white' : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)]'}`} aria-label={doneToday ? 'Abhaken' : 'Erledigen'}>
                  {doneToday && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${doneToday ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>{habit.name}</span>
                  <div className="flex gap-1 mt-1">
                    {last7Days.map(d => {
                      const done = habitLogs.some(l => l.habitId === habit.id && l.date === d && l.completed);
                      return <div key={d} className={`w-3 h-3 rounded-sm ${done ? 'bg-emerald-400' : 'bg-[var(--color-border)]'}`} />;
                    })}
                  </div>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-bold">{streak}</span>
                  </div>
                )}
                <Badge>{habit.frequency === 'daily' ? 'Täglich' : 'Wöchentlich'}</Badge>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Neue Gewohnheit">
        <div className="space-y-3">
          <Input placeholder="Name der Gewohnheit" value={newName} onChange={e => setNewName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && addHabit()} />
          <div className="flex gap-2">
            <button onClick={() => setNewFreq('daily')} className={`flex-1 py-2 rounded-lg text-sm border ${newFreq === 'daily' ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)]'}`}>Täglich</button>
            <button onClick={() => setNewFreq('weekly')} className={`flex-1 py-2 rounded-lg text-sm border ${newFreq === 'weekly' ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)]'}`}>Wöchentlich</button>
          </div>
          <Button onClick={addHabit} className="w-full">Erstellen</Button>
        </div>
      </Modal>
    </div>
  );
}
