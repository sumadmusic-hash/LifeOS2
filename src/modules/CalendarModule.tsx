import { useState } from 'react';
import { useDataStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, EmptyState, Modal } from '../core/ui';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { CalendarEvent } from '../core/db';

export default function CalendarModule() {
  const { calendar, setCalendar } = useDataStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];
  
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });

  const addEvent = async () => {
    if (!newTitle.trim() || !newStart) return;
    const event: CalendarEvent = {
      id: nanoid(), title: newTitle.trim(), start: newStart,
      end: newEnd || undefined, color: newColor,
      createdAt: new Date().toISOString(),
    };
    await repos.calendar.create(event);
    const all = await repos.calendar.getAll();
    setCalendar(all);
    setNewTitle(''); setNewStart(''); setNewEnd(''); setShowAdd(false);
    toast.success('Termin erstellt');
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendar.filter(e => e.start.startsWith(dateStr));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Kalender</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" /> Neuer Termin</Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] focus-ring">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold capitalize">
          {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] focus-ring">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-[var(--color-border)] rounded-xl overflow-hidden">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="bg-[var(--color-surface-alt)] p-2 text-center text-xs font-medium text-[var(--color-text-secondary)]">{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={i} className="bg-[var(--color-surface)] p-2 min-h-[80px]" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const events = getEventsForDay(day);
          const isToday = dateStr === today;
          return (
            <div key={i} className={`bg-[var(--color-surface)] p-1 min-h-[80px] ${isToday ? 'ring-2 ring-inset ring-[var(--color-accent)]' : ''}`}>
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}>{day}</div>
              {events.slice(0, 3).map(e => (
                <div key={e.id} className="text-[10px] truncate px-1 py-0.5 rounded mb-0.5 text-white" style={{ backgroundColor: e.color || '#6366f1' }}>
                  {e.title}
                </div>
              ))}
              {events.length > 3 && <div className="text-[10px] text-[var(--color-text-muted)]">+{events.length - 3} mehr</div>}
            </div>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Neuer Termin">
        <div className="space-y-3">
          <Input placeholder="Titel" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus />
          <Input type="datetime-local" value={newStart} onChange={e => setNewStart(e.target.value)} />
          <Input type="datetime-local" value={newEnd} onChange={e => setNewEnd(e.target.value)} placeholder="Ende (optional)" />
          <div className="flex gap-2">
            {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
              <button key={c} onClick={() => setNewColor(c)} className={`w-8 h-8 rounded-full ${newColor === c ? 'ring-2 ring-offset-2 ring-[var(--color-accent)]' : ''}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <Button onClick={addEvent} className="w-full">Erstellen</Button>
        </div>
      </Modal>
    </div>
  );
}
