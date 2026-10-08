import { useState } from 'react';
import { useDataStore, useUndoStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, Badge, ProgressBar, EmptyState, Modal, Textarea } from '../core/ui';
import { Plus, Target, Check, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { Goal } from '../core/db';

export default function GoalsModule() {
  const { goals, setGoals } = useDataStore();
  const undo = useUndoStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addGoal = async () => {
    if (!newTitle.trim()) return;
    const goal: Goal = {
      id: nanoid(), title: newTitle.trim(), description: newDesc,
      status: 'active', progress: 0, milestones: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await repos.goals.create(goal);
    const all = await repos.goals.getAll();
    setGoals(all);
    setNewTitle(''); setNewDesc(''); setShowAdd(false);
    toast.success('Ziel erstellt');
  };

  const updateProgress = async (goal: Goal, progress: number) => {
    undo.push({ action: 'update_goal', entityType: 'goal', entityId: goal.id, previousState: JSON.stringify(goal) });
    await repos.goals.update(goal.id, { progress, updatedAt: new Date().toISOString() });
    const all = await repos.goals.getAll();
    setGoals(all);
  };

  const completeGoal = async (goal: Goal) => {
    undo.push({ action: 'complete_goal', entityType: 'goal', entityId: goal.id, previousState: JSON.stringify(goal) });
    await repos.goals.update(goal.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    const all = await repos.goals.getAll();
    setGoals(all);
    toast.success('🎉 Ziel erreicht!');
  };

  const deleteGoal = async (goal: Goal) => {
    undo.push({ action: 'delete_goal', entityType: 'goal', entityId: goal.id, previousState: JSON.stringify(goal) });
    await repos.goals.delete(goal.id);
    const all = await repos.goals.getAll();
    setGoals(all);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Ziele</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" /> Neues Ziel</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon="🎯" title="Keine Ziele" description="Setze dir Ziele und verfolge deinen Fortschritt." action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-3 h-3" /> Ziel setzen</Button>} />
      ) : (
        <div className="space-y-3">
          {goals.map(goal => (
            <Card key={goal.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-[var(--color-text)]">{goal.title}</h3>
                  {goal.description && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{goal.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Badge color={goal.status === 'completed' ? 'success' : goal.status === 'paused' ? 'warning' : 'accent'}>{goal.status}</Badge>
                  {goal.status !== 'completed' && (
                    <button onClick={() => completeGoal(goal)} className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus-ring" aria-label="Abschließen">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </button>
                  )}
                  <button onClick={() => deleteGoal(goal)} className="p-1 rounded hover:bg-[var(--color-danger-light)] focus-ring" aria-label="Löschen">
                    <Trash2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar value={goal.progress} className="flex-1" />
                <span className="text-xs text-[var(--color-text-muted)] w-10 text-right">{goal.progress}%</span>
              </div>
              {goal.status !== 'completed' && (
                <div className="flex gap-1 mt-2">
                  {[25, 50, 75, 100].map(v => (
                    <button key={v} onClick={() => updateProgress(goal, v)} className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface-alt)] hover:bg-[var(--color-accent-light)] text-[var(--color-text-secondary)] focus-ring">
                      {v}%
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Neues Ziel">
        <div className="space-y-3">
          <Input placeholder="Ziel-Titel" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus />
          <Textarea placeholder="Beschreibung (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
          <Button onClick={addGoal} className="w-full">Ziel erstellen</Button>
        </div>
      </Modal>
    </div>
  );
}
