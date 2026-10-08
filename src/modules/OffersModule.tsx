import { useState } from 'react';
import { useDataStore } from '../core/state';
import { repos } from '../core/db';
import { Card, Button, Input, Badge, EmptyState, Modal, Textarea } from '../core/ui';
import { Plus, Tag, Search } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import type { Offer } from '../core/db';

export default function OffersModule() {
  const { offers, setOffers } = useDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [search, setSearch] = useState('');

  const filtered = offers.filter(o => !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.category.includes(search.toLowerCase()));

  const addOffer = async () => {
    if (!title.trim() || !price) return;
    const offer: Offer = {
      id: nanoid(), title: title.trim(), price: parseFloat(price),
      currency: 'EUR', category: category || 'sonstiges', url: url || undefined,
      createdAt: new Date().toISOString(),
    };
    await repos.offers.create(offer);
    const all = await repos.offers.getAll();
    setOffers(all);
    setTitle(''); setPrice(''); setCategory(''); setUrl(''); setShowAdd(false);
    toast.success('Angebot hinzugefügt');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Angebote</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" /> Neues Angebot</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <Input placeholder="Angebote suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🏷️" title="Keine Angebote" description="Tracke Preise und Angebote." action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-3 h-3" /> Angebot hinzufügen</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map(offer => (
            <Card key={offer.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center">
                <Tag className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{offer.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge color="accent">{offer.category}</Badge>
                  {offer.url && <a href={offer.url} target="_blank" rel="noopener" className="text-xs text-[var(--color-accent)] hover:underline">Link</a>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[var(--color-text)]">{offer.price.toFixed(2)}</span>
                <span className="text-xs text-[var(--color-text-muted)] ml-0.5">{offer.currency}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Neues Angebot">
        <div className="space-y-3">
          <Input placeholder="Titel" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <div className="flex gap-2">
            <Input placeholder="Preis" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="flex-1" />
            <Input placeholder="Kategorie" value={category} onChange={e => setCategory(e.target.value)} className="flex-1" />
          </div>
          <Input placeholder="URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
          <Button onClick={addOffer} className="w-full">Hinzufügen</Button>
        </div>
      </Modal>
    </div>
  );
}
