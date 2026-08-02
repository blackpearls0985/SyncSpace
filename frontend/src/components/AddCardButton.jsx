import React, { useState } from 'react';
import { PlusIcon } from './Icons';

/**
 * AddCardButton
 * Restyled light inline form button component.
 */
export default function AddCardButton({ onAddCard }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAddCard(title.trim());
      setTitle('');
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 
                   hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors 
                   duration-150 text-left"
      >
        <PlusIcon className="w-4 h-4 text-slate-400" />
        Add a card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for this card..."
        rows={2}
        className="w-full bg-white border border-[var(--color-accent-border)] text-slate-900 text-xs rounded-xl p-2.5 
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none shadow-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="btn-primary text-xs py-1.5 px-3"
        >
          {submitting ? 'Adding...' : 'Add card'}
        </button>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setTitle(''); }}
          className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
