import React from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon, LayoutDashboardIcon } from './Icons';

/**
 * BoardCard
 * Board preview card component supporting light and dark modes.
 */
export default function BoardCard({ board, orgId, currentUserId, isAdmin, onDelete }) {
  const isCreator = board.createdBy?.id === currentUserId;
  const canDelete = isCreator || isAdmin;

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete board "${board.name}"?`)) {
      onDelete(board.id);
    }
  };

  return (
    <Link
      to={`/org/${orgId}/boards/${board.id}`}
      className="card bg-white dark:bg-slate-900 hover:border-[var(--color-accent-border)] transition-all duration-200 
                 group flex flex-col justify-between h-44 relative shadow-sm hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-accent-border)] 
                            flex items-center justify-center text-[var(--color-accent)] group-hover:scale-105 transition-transform shadow-xs">
              <LayoutDashboardIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-[var(--color-accent)] transition-colors truncate max-w-[160px]">
              {board.name}
            </h3>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-slate-400 dark:text-slate-500 
                         hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
              title="Delete board"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Created by <span className="text-slate-700 dark:text-slate-300 font-semibold">{board.createdBy?.name || 'Unknown'}</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
        <span className="font-medium text-slate-600 dark:text-slate-300">{board._count?.lists ?? 0} lists</span>
        <span>
          {new Date(board.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </Link>
  );
}
