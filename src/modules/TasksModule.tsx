import { useState } from 'react';
import { useDataStore, useUndoStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, Badge, PriorityDot, EmptyState, Modal, Select } from '../core/ui';
import { Plus, Check, Trash2, Filter, Search } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { Task } from '../core/db';

export default function TasksModule() {
  const { tasks, setTasks } = useDataStore();
  const undo = useUndoStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');

  const activeTasks = tasks.filter(t => !t.deletedAt);
  const filteredTasks = activeTasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const p = { urgent: 0, high: 1, medium: 2, low: 3 };
        return p[a.priority] - p[b.priority];
      }
      if (sortBy === 'dueDate') return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
      return b.createdAt.localeCompare(a.createdAt);
    });

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: nanoid(), title: newTitle.trim(), priority: newPriority,
      status: 'todo', tags: [], dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await repos.tasks.create(task);
    const all = await repos.tasks.getAll();
    setTasks(all);
    setNewTitle(''); setNewPriority('medium'); setNewDueDate('');
    setShowAdd(false);
    toast.success('Aufgabe erstellt');
  };

  const completeTask = async (task: Task) => {
    undo.push({ action: 'complete_task', entityType: 'task', entityId: task.id, previousState: JSON.stringify(task) });
    await repos.tasks.update(task.id, { status: 'done', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    const all = await repos.tasks.getAll();
    setTasks(all);
    toast.success(`✓ ${task.title}`);
  };

  const deleteTask = async (task: Task) => {
    undo.push({ action: 'delete_task', entityType: 'task', entityId: task.id, previousState: JSON.stringify(task) });
    await repos.tasks.update(task.id, { deletedAt: new Date().toISOString() });
    const all = await repos.tasks.getAll();
    setTasks(all);
    toast('Aufgabe gelöscht', { icon: '🗑️' });
  };

  const toggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'todo' : task.status;
    undo.push({ action: 'update_task', entityType: 'task', entityId: task.id, previousState: JSON.stringify(task) });
    await repos.tasks.update(task.id, { status: nextStatus, updatedAt: new Date().toISOString() });
    const all = await repos.tasks.getAll();
    setTasks(all);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Aufgaben</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" /> Neue Aufgabe</Button>
      </div>

      {/* Quick Add */}
      <div className="flex gap-2 mb-4">
        <Input placeholder="Schnell: Neue Aufgabe..." value={search ? '' : newTitle} onChange={(e) => { setNewTitle(e.target.value); if (e.target.value && !showAdd) setShowAdd(true); }} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="flex-1" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1 bg-[var(--color-surface-alt)] rounded-lg p-1">
          {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-xs rounded-md transition-colors ${filter === f ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
              {f === 'all' ? 'Alle' : f === 'todo' ? 'Offen' : f === 'in_progress' ? 'In Arbeit' : 'Erledigt'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7" />
        </div>
        <Select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="w-auto text-xs">
          <option value="priority">Priorität</option>
          <option value="dueDate">Fälligkeit</option>
          <option value="created">Erstellt</option>
        </Select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState icon="📋" title="Keine Aufgaben" description="Erstelle deine erste Aufgabe oder ändere den Filter." action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-3 h-3" /> Aufgabe erstellen</Button>} />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <Card key={task.id} className={`flex items-center gap-3 py-3 px-4 ${task.status === 'done' ? 'opacity-60' : ''}`}>
              <button onClick={() => task.status === 'done' ? toggleStatus(task) : completeTask(task)} className="focus-ring rounded-full" aria-label={task.status === 'done' ? 'Wieder öffnen' : 'Erledigen'}>
                {task.status === 'done' ? <Check className="w-5 h-5 text-emerald-500" /> : <div className={`w-5 h-5 rounded-full border-2 ${task.status === 'in_progress' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20' : 'border-[var(--color-border)]'}`} />}
              </button>
              <PriorityDot priority={task.priority} />
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${task.status === 'done' ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>{task.title}</span>
                {task.dueDate && (
                  <span className={`text-xs ml-2 ${task.dueDate < new Date().toISOString().split('T')[0] ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>
                    {task.dueDate}
                  </span>
                )}
              </div>
              <Badge color={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'default'}>{task.priority}</Badge>
              <button onClick={() => deleteTask(task)} className="p-1 rounded hover:bg-[var(--color-danger-light)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] focus-ring" aria-label="Löschen">
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 flex gap-4 text-xs text-[var(--color-text-muted)]">
        <span>{activeTasks.filter(t => t.status === 'todo').length} offen</span>
        <span>{activeTasks.filter(t => t.status === 'in_progress').length} in Arbeit</span>
        <span>{activeTasks.filter(t => t.status === 'done').length} erledigt</span>
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Neue Aufgabe">
        <div className="space-y-3">
          <Input placeholder="Titel" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && addTask()} />
          <div className="flex gap-2">
            <Select value={newPriority} onChange={e => setNewPriority(e.target.value as Task['priority'])} className="flex-1">
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="urgent">Dringend</option>
            </Select>
            <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="flex-1" />
          </div>
          <Button onClick={addTask} className="w-full">Erstellen</Button>
        </div>
      </Modal>
    </div>
  );
}
