import React from 'react';

// Button
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg' }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]',
    secondary: 'bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]',
    ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
    danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  };
  const sizes = { sm: 'px-2 py-1 text-xs gap-1', md: 'px-3 py-1.5 text-sm gap-1.5', lg: 'px-4 py-2 text-base gap-2' };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}

// Card
export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 ${className}`} {...props}>{children}</div>;
}

// Input
export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] ${className}`} {...props} />;
}

// Textarea
export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] resize-none ${className}`} {...props} />;
}

// Select
export function Select({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text)] ${className}`} {...props}>{children}</select>;
}

// Badge
export function Badge({ children, color = 'default', className = '' }: { children: React.ReactNode; color?: 'default' | 'success' | 'warning' | 'danger' | 'accent'; className?: string }) {
  const colors = {
    default: 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    accent: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colors[color]} ${className}`}>{children}</span>;
}

// Empty State
export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-medium text-[var(--color-text)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// Skeleton
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--color-surface-alt)] rounded-lg ${className}`} />;
}

// Priority indicator
export function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || 'bg-gray-400'}`} />;
}

// Progress bar
export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] focus-ring" aria-label="Schließen">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Tabs
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-[var(--color-border)] mb-4">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors focus-ring ${active === tab.id ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
