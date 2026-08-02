import React, { useState } from 'react';
import { PlusIcon } from './Icons';

/**
 * AddListButton
 * Restyled light inline form button component for adding board lists.
 */
export default function AddListButton({ onAddList }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onAddList(name.trim());
      setName('');
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-72 h-12 flex items-center justify-center gap-2 bg-slate-200/50 
                   hover:bg-slate-200/80 border border-slate-300/80 border-dashed rounded-2xl 
                   text-slate-600 hover:text-slate-900 font-semibold text-xs transition-all 
                   duration-150 flex-shrink-0"
      >
        <PlusIcon className="w-4 h-4 text-[var(--color-accent)]" />
        Add another list
      </button>
    );
  }

  return (
    <div className="w-72 bg-white border border-slate-200 rounded-2xl p-3 flex-shrink-0 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter list title..."
          className="w-full bg-slate-50 border border-[var(--color-accent-border)] text-slate-900 text-xs rounded-xl px-3 py-2 
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] font-medium"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {submitting ? 'Adding...' : 'Add list'}
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setName(''); }}
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
