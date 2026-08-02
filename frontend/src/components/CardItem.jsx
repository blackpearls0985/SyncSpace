import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * CardItem
 * Sortable card item component supporting light and dark modes.
 */
export default function CardItem({ card, onOpenModal }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'CARD',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          onOpenModal(card);
        }
      }}
      className={`group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-3 shadow-xs 
                 hover:border-[var(--color-accent-border)] hover:shadow-sm cursor-grab active:cursor-grabbing 
                 transition-all duration-150 relative select-none ${
                   isDragging ? 'ring-2 ring-[var(--color-accent)] shadow-xl z-50' : ''
                 }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[var(--color-accent)] leading-snug break-words">
          {card.title}
        </h4>
      </div>

      {/* Meta indicators */}
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-1 text-xs">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          {card.description && (
            <span title="Has description" className="flex items-center text-slate-400 dark:text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </span>
          )}

          {card.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isOverdue
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(card.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {card.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent-border)] 
                       flex items-center justify-center text-[var(--color-accent)] text-[10px] font-extrabold"
            title={`Assigned to ${card.assignee.name}`}
          >
            {card.assignee.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
