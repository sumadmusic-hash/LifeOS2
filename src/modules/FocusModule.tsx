import { useState, useEffect, useRef } from 'react';
import { useDataStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Select } from '../core/ui';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { FocusSession } from '../core/db';

export default function FocusModule() {
  const { focusSessions, tasks, setFocusSessions } = useDataStore();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [duration, setDuration] = useState(25);
  const [selectedTask, setSelectedTask] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openTasks = tasks.filter(t => !t.deletedAt && t.status !== 'done' && t.status !== 'cancelled');
  const todaySessions = focusSessions.filter(s => s.startedAt.startsWith(new Date().toISOString().split('T')[0]));
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const handleComplete = async () => {
    setIsRunning(false);
    if (sessionId) {
      await repos.focusSessions.update(sessionId, {
        endedAt: new Date().toISOString(),
        duration,
        completed: true,
      });
      const all = await repos.focusSessions.getAll();
      setFocusSessions(all);
    }
    toast.success(mode === 'work' ? '🎉 Fokus-Session abgeschlossen!' : 'Pause beendet!');
    if (mode === 'work') {
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('work');
      setTimeLeft(duration * 60);
    }
  };

  const startSession = async () => {
    const session: FocusSession = {
      id: nanoid(),
      taskId: selectedTask || undefined,
      startedAt: new Date().toISOString(),
      duration: mode === 'work' ? duration : 5,
      type: mode,
      completed: false,
    };
    await repos.focusSessions.create(session);
    setSessionId(session.id);
    setIsRunning(true);
    setTimeLeft(mode === 'work' ? duration * 60 : 5 * 60);
    toast.success(mode === 'work' ? '🎯 Fokus gestartet!' : '☕ Pause gestartet!');
  };

  const stopSession = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (sessionId) {
      repos.focusSessions.update(sessionId, { endedAt: new Date().toISOString(), completed: false });
    }
    setSessionId(null);
  };

  const reset = () => {
    stopSession();
    setTimeLeft(mode === 'work' ? duration * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = mode === 'work' ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="max-w-lg mx-auto p-4 md:p-6 animate-fade-in">
      <h1 className="text-xl font-bold text-[var(--color-text)] mb-6 text-center">Fokus</h1>

      {/* Timer Display */}
      <Card className="text-center py-8 mb-4">
        <div className="relative w-48 h-48 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="4" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={mode === 'work' ? 'var(--color-accent)' : 'var(--color-success)'} strokeWidth="4" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`} strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono text-[var(--color-text)]">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-1">
              {mode === 'work' ? '🎯 Fokus' : '☕ Pause'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button onClick={startSession} size="lg"><Play className="w-5 h-5" /> Start</Button>
          ) : (
            <Button onClick={stopSession} variant="danger" size="lg"><Pause className="w-5 h-5" /> Stop</Button>
          )}
          <Button onClick={reset} variant="ghost" size="lg"><RotateCcw className="w-5 h-5" /></Button>
        </div>
      </Card>

      {/* Settings */}
      <Card className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Modus</span>
            <div className="flex gap-1 bg-[var(--color-surface-alt)] rounded-lg p-1">
              <button onClick={() => { setMode('work'); setTimeLeft(duration * 60); }} className={`px-3 py-1 text-xs rounded-md ${mode === 'work' ? 'bg-[var(--color-accent)] text-white' : ''}`}>Fokus</button>
              <button onClick={() => { setMode('break'); setTimeLeft(5 * 60); }} className={`px-3 py-1 text-xs rounded-md ${mode === 'break' ? 'bg-[var(--color-success)] text-white' : ''}`}>Pause</button>
            </div>
          </div>
          {mode === 'work' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Dauer</span>
              <Select value={duration} onChange={e => { setDuration(Number(e.target.value)); setTimeLeft(Number(e.target.value) * 60); }} className="w-24">
                <option value={15}>15 min</option>
                <option value={25}>25 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Aufgabe (optional)</span>
            <Select value={selectedTask} onChange={e => setSelectedTask(e.target.value)} className="w-40">
              <option value="">Keine</option>
              {openTasks.map(t => <option key={t.id} value={t.id}>{t.title.slice(0, 20)}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {/* Today Stats */}
      <Card>
        <h3 className="text-sm font-semibold mb-2">Heute</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Sessions</span>
          <span className="font-medium">{todaySessions.filter(s => s.completed).length}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-[var(--color-text-secondary)]">Gesamtzeit</span>
          <span className="font-medium">{todayMinutes} min</span>
        </div>
      </Card>
    </div>
  );
}
