import { useState, useEffect } from 'react';
import { useDataStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, Badge } from '../core/ui';
import { User, Heart, Zap, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileModule() {
  const { profile, setProfile } = useDataStore();
  const [name, setName] = useState('');
  const [values, setValues] = useState('');
  const [interests, setInterests] = useState('');
  const [stressFactors, setStressFactors] = useState('');
  const [energyMorning, setEnergyMorning] = useState(true);
  const [energyAfternoon, setEnergyAfternoon] = useState(true);
  const [energyEvening, setEnergyEvening] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setValues(profile.values.join(', '));
      setInterests(profile.interests.join(', '));
      setStressFactors(profile.stressFactors.join(', '));
      setEnergyMorning(profile.energyTimes.morning);
      setEnergyAfternoon(profile.energyTimes.afternoon);
      setEnergyEvening(profile.energyTimes.evening);
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    const updated = {
      ...profile,
      name,
      values: values.split(',').map(v => v.trim()).filter(Boolean),
      interests: interests.split(',').map(v => v.trim()).filter(Boolean),
      stressFactors: stressFactors.split(',').map(v => v.trim()).filter(Boolean),
      energyTimes: { morning: energyMorning, afternoon: energyAfternoon, evening: energyEvening },
      updatedAt: new Date().toISOString(),
    };
    await repos.profile.save(updated);
    setProfile(updated);
    toast.success('Profil gespeichert');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in">
      <h1 className="text-xl font-bold text-[var(--color-text)] mb-6">Profil</h1>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
              <User className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="font-medium text-[var(--color-text)]">Persönliche Daten</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Wie die KI dich besser verstehen kann</p>
            </div>
          </div>
          <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="mb-2" />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold">Werte</h3>
          </div>
          <Input placeholder="z.B. Familie, Gesundheit, Freiheit (kommagetrennt)" value={values} onChange={e => setValues(e.target.value)} />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold">Interessen</h3>
          </div>
          <Input placeholder="z.B. Programmieren, Lesen, Sport (kommagetrennt)" value={interests} onChange={e => setInterests(e.target.value)} />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Energiezeiten</h3>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={energyMorning} onChange={e => setEnergyMorning(e.target.checked)} className="rounded" />
              Morgen
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={energyAfternoon} onChange={e => setEnergyAfternoon(e.target.checked)} className="rounded" />
              Nachmittag
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={energyEvening} onChange={e => setEnergyEvening(e.target.checked)} className="rounded" />
              Abend
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-2">Stressfaktoren</h3>
          <Input placeholder="z.B. Zeitdruck, Multitasking (kommagetrennt)" value={stressFactors} onChange={e => setStressFactors(e.target.value)} />
        </Card>

        <Button onClick={save} className="w-full">Profil speichern</Button>
      </div>
    </div>
  );
}
