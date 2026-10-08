import { useState } from 'react';
import { useDataStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, Textarea, Badge, EmptyState, Modal } from '../core/ui';
import { Plus, Search } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { JournalEntry } from '../core/db';

export default function JournalModule() {
  const { journal, setJournal } = useDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState(3);
  const [search, setSearch] = useState('');

  const filtered = journal
    .filter(e => !search || e.content.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.includes(search.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date));

  const addEntry = async () => {
    if (!newContent.trim()) return;
    const entry: JournalEntry = {
      id: nanoid(), date: new Date().toISOString().split('T')[0],
      content: newContent.trim(), mood: newMood, tags: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await repos.journal.create(entry);
    const all = await repos.journal.getAll();
    setJournal(all);
    setNewContent(''); setNewMood(3); setShowAdd(false);
    toast.success('Eintrag erstellt');
  };

  const moodEmoji = (mood: number) => ['😢', '😕', '😐', '😊', '🤩'][mood - 1] || '😐';

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Journal</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" /> Neuer Eintrag</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <Input placeholder="Einträge durchsuchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📝" title="Keine Einträge" description="Starte ein Journal und reflektiere deinen Tag." action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-3 h-3" /> Eintrag schreiben</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <Card key={entry.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{moodEmoji(entry.mood)}</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">{new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                <Badge>{entry.mood}/5</Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{entry.content}</p>
              {entry.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {entry.tags.map(tag => <Badge key={tag} color="accent">#{tag}</Badge>)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tagebuch-Eintrag">
        <div className="space-y-3">
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map(m => (
              <button key={m} onClick={() => setNewMood(m)} className={`text-2xl p-1 rounded-lg transition-transform ${newMood === m ? 'scale-125 bg-[var(--color-accent-light)]' : 'opacity-50 hover:opacity-100'}`}>
                {moodEmoji(m)}
              </button>
            ))}
          </div>
          <Textarea placeholder="Was beschäftigt dich heute?" value={newContent} onChange={e => setNewContent(e.target.value)} rows={5} autoFocus />
          <Button onClick={addEntry} className="w-full">Speichern</Button>
        </div>
      </Modal>
    </div>
  );
}
