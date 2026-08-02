import React, { useState, useEffect } from 'react';
import { TrashIcon, UserIcon } from './Icons';

/**
 * CardDetailModal
 * Modal panel component supporting light and dark modes.
 */
export default function CardDetailModal({
  card,
  orgMembers,
  onClose,
  onUpdateCard,
  onDeleteCard,
}) {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [assigneeId, setAssigneeId] = useState(card?.assigneeId || '');
  const [dueDate, setDueDate] = useState(
    card?.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setAssigneeId(card.assigneeId || '');
      setDueDate(
        card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''
      );
    }
  }, [card]);

  if (!card) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onUpdateCard(card.id, {
        title: title.trim(),
        description: description.trim() || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save card changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete card "${card.title}"?`)) {
      setSaving(true);
      try {
        await onDeleteCard(card.id);
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to delete card.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title..."
            className="text-xl font-bold bg-transparent text-slate-900 dark:text-slate-100 border-b border-transparent 
                       focus:border-[var(--color-accent)] focus:outline-none w-full pb-1"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-3 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-slate-100 dark:border-slate-800 py-4">
          {/* Assignee Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="">Unassigned</option>
              {orgMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field text-xs py-2"
            />
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add detailed description or notes..."
            className="input-field text-xs resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="btn-danger text-xs"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Delete card
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="btn-primary text-xs"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
