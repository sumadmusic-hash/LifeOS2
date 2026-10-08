import { useState } from 'react';
import { useDataStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, Badge, EmptyState, Modal, Select } from '../core/ui';
import { Plus, Briefcase, ArrowRight } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { JobApplication } from '../core/db';

const PHASES: JobApplication['phase'][] = ['research', 'applied', 'interview', 'offer', 'rejected', 'closed'];
const PHASE_LABELS: Record<string, string> = { research: 'Recherche', applied: 'Beworben', interview: 'Interview', offer: 'Angebot', rejected: 'Abgelehnt', closed: 'Geschlossen' };
const PHASE_COLORS: Record<string, string> = { research: 'bg-blue-100 text-blue-700', applied: 'bg-purple-100 text-purple-700', interview: 'bg-amber-100 text-amber-700', offer: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700', closed: 'bg-gray-100 text-gray-700' };

export default function JobBoardModule() {
  const { jobApplications, setJobApplications } = useDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [url, setUrl] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');

  const filtered = filterPhase === 'all' ? jobApplications : jobApplications.filter(a => a.phase === filterPhase);

  const addApplication = async () => {
    if (!company.trim() || !position.trim()) return;
    const app: JobApplication = {
      id: nanoid(), company: company.trim(), position: position.trim(),
      phase: 'research', url: url || undefined, notes: '',
      history: [{ phase: 'research', date: new Date().toISOString() }],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await repos.jobApplications.create(app);
    const all = await repos.jobApplications.getAll();
    setJobApplications(all);
    setCompany(''); setPosition(''); setUrl(''); setShowAdd(false);
    toast.success('Bewerbung erstellt');
  };

  const movePhase = async (app: JobApplication, newPhase: JobApplication['phase']) => {
    app.history.push({ phase: newPhase, date: new Date().toISOString() });
    await repos.jobApplications.update(app.id, { phase: newPhase, history: app.history, updatedAt: new Date().toISOString() });
    const all = await repos.jobApplications.getAll();
    setJobApplications(all);
    toast.success(`${PHASE_LABELS[newPhase]}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Job Board</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" /> Neue Bewerbung</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4 flex-wrap">
        <button onClick={() => setFilterPhase('all')} className={`px-2 py-1 text-xs rounded-md ${filterPhase === 'all' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'}`}>Alle ({jobApplications.length})</button>
        {PHASES.map(p => (
          <button key={p} onClick={() => setFilterPhase(p)} className={`px-2 py-1 text-xs rounded-md ${filterPhase === p ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'}`}>
            {PHASE_LABELS[p]} ({jobApplications.filter(a => a.phase === p).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="💼" title="Keine Bewerbungen" description="Tracke deine Bewerbungen und den Status." action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-3 h-3" /> Bewerbung hinzufügen</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(app => (
            <Card key={app.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-sm text-[var(--color-text)]">{app.position}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">{app.company}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PHASE_COLORS[app.phase]}`}>{PHASE_LABELS[app.phase]}</span>
              </div>
              {app.url && <a href={app.url} target="_blank" rel="noopener" className="text-xs text-[var(--color-accent)] hover:underline block mb-2 truncate">{app.url}</a>}
              {app.notes && <p className="text-xs text-[var(--color-text-muted)] mb-2">{app.notes}</p>}
              <div className="flex items-center gap-1 mt-2">
                {PHASES.filter(p => p !== app.phase && PHASES.indexOf(p) > PHASES.indexOf(app.phase)).slice(0, 2).map(nextPhase => (
                  <button key={nextPhase} onClick={() => movePhase(app, nextPhase)} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-alt)] hover:bg-[var(--color-accent-light)] text-[var(--color-text-secondary)] focus-ring">
                    <ArrowRight className="w-2.5 h-2.5" /> {PHASE_LABELS[nextPhase]}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Neue Bewerbung">
        <div className="space-y-3">
          <Input placeholder="Unternehmen" value={company} onChange={e => setCompany(e.target.value)} autoFocus />
          <Input placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} />
          <Input placeholder="URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
          <Button onClick={addApplication} className="w-full">Erstellen</Button>
        </div>
      </Modal>
    </div>
  );
}
