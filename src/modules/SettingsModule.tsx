import { useState } from 'react';
import { useDataStore, useUiStore } from '../core/state';
import { repos, db } from '../core/db';
import { Card, Button, Input, Select, Badge } from '../core/ui';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Download, Upload, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Settings as SettingsType } from '../core/db';

export default function SettingsModule() {
  const { settings, setSettings, tasks, goals, habits, habitLogs, journal, calendar, focusSessions, jobApplications, offers, profile } = useDataStore();
  const { theme, setTheme } = useUiStore();
  const [localSettings, setLocalSettings] = useState<SettingsType | null>(settings);

  const save = async () => {
    if (!localSettings) return;
    await repos.settings.save(localSettings);
    setSettings(localSettings);
    setTheme(localSettings.theme);
    toast.success('Einstellungen gespeichert');
  };

  const exportData = () => {
    const data = { tasks, goals, habits, habitLogs, journal, calendar, focusSessions, jobApplications, offers, profile, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lifeos-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Daten exportiert');
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.tasks) { await db.tasks.clear(); await db.tasks.bulkAdd(data.tasks); }
      if (data.goals) { await db.goals.clear(); await db.goals.bulkAdd(data.goals); }
      if (data.habits) { await db.habits.clear(); await db.habits.bulkAdd(data.habits); }
      if (data.habitLogs) { await db.habitLogs.clear(); await db.habitLogs.bulkAdd(data.habitLogs); }
      if (data.journal) { await db.journal.clear(); await db.journal.bulkAdd(data.journal); }
      if (data.calendar) { await db.calendar.clear(); await db.calendar.bulkAdd(data.calendar); }
      if (data.jobApplications) { await db.jobApplications.clear(); await db.jobApplications.bulkAdd(data.jobApplications); }
      if (data.offers) { await db.offers.clear(); await db.offers.bulkAdd(data.offers); }
      toast.success('Daten importiert! Seite wird neu geladen...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error('Ungültige Datei');
    }
  };

  if (!localSettings) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in">
      <h1 className="text-xl font-bold text-[var(--color-text)] mb-6">Einstellungen</h1>

      <div className="space-y-4">
        {/* AI Provider */}
        <Card>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" /> KI-Provider
          </h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Select value={localSettings.aiProvider} onChange={e => setLocalSettings({ ...localSettings, aiProvider: e.target.value })} className="flex-1">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="ollama">Ollama (lokal)</option>
                <option value="groq">Groq</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
              </Select>
              <Input placeholder="Modell" value={localSettings.aiModel} onChange={e => setLocalSettings({ ...localSettings, aiModel: e.target.value })} className="flex-1" />
            </div>
            <Input placeholder="API Key" type="password" value={localSettings.aiApiKey} onChange={e => setLocalSettings({ ...localSettings, aiApiKey: e.target.value })} />
            <Input placeholder="Base URL (optional, z.B. für Ollama: http://localhost:11434/v1)" value={localSettings.aiBaseUrl} onChange={e => setLocalSettings({ ...localSettings, aiBaseUrl: e.target.value })} />
            <p className="text-xs text-[var(--color-text-muted)]">⚠️ API-Keys werden NIEMALS exportiert.</p>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Darstellung</h3>
          <div className="flex gap-2">
            <button onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })} className={`flex-1 py-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${localSettings.theme === 'light' ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)]'}`}>
              <Sun className="w-4 h-4" /> Hell
            </button>
            <button onClick={() => setLocalSettings({ ...localSettings, theme: 'dark' })} className={`flex-1 py-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${localSettings.theme === 'dark' ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)]'}`}>
              <Moon className="w-4 h-4" /> Dunkel
            </button>
            <button onClick={() => setLocalSettings({ ...localSettings, theme: 'system' })} className={`flex-1 py-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${localSettings.theme === 'system' ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)]'}`}>
              <Monitor className="w-4 h-4" /> System
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setLocalSettings({ ...localSettings, density: 'comfortable' })} className={`flex-1 py-2 rounded-lg border text-sm ${localSettings.density === 'comfortable' ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)]'}`}>Komfortabel</button>
            <button onClick={() => setLocalSettings({ ...localSettings, density: 'dense' })} className={`flex-1 py-2 rounded-lg border text-sm ${localSettings.density === 'dense' ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)]'}`}>Kompakt</button>
          </div>
        </Card>

        {/* Token Budget */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Token-Budget</h3>
          <div className="flex items-center gap-2">
            <Input type="number" value={localSettings.tokenBudget} onChange={e => setLocalSettings({ ...localSettings, tokenBudget: Number(e.target.value) })} className="w-32" />
            <span className="text-sm text-[var(--color-text-secondary)]">Tokens pro Request</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input type="number" value={localSettings.rateLimit} onChange={e => setLocalSettings({ ...localSettings, rateLimit: Number(e.target.value) })} className="w-32" />
            <span className="text-sm text-[var(--color-text-secondary)]">Requests pro Minute</span>
          </div>
        </Card>

        {/* Data */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Daten</h3>
          <div className="flex gap-2">
            <Button onClick={exportData} variant="secondary" size="sm"><Download className="w-3 h-3" /> Exportieren</Button>
            <label className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] cursor-pointer">
              <Upload className="w-3 h-3 mr-1.5" /> Importieren
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </Card>

        <Button onClick={save} className="w-full">Speichern</Button>
      </div>
    </div>
  );
}
