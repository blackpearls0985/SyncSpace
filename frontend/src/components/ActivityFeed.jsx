import React from 'react';
import { Link } from 'react-router-dom';

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * ActivityFeed
 * Collapsible activity sidebar component supporting light and dark modes with Free vs Pro callout.
 */
export default function ActivityFeed({ orgId, boardId, activities, tier = 'FREE', loading, isOpen, onClose }) {
  if (!isOpen) return null;

  const isTruncated = tier === 'FREE' && activities.length >= 10;

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full 
                      shadow-xl z-30 animate-in slide-in-from-right duration-200 transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Activity Feed</h2>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {tier}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-4 justify-center">
            <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-xs text-center py-8">No activity recorded yet.</p>
        ) : (
          <>
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent-border)] 
                                flex items-center justify-center text-[var(--color-accent)] font-bold text-[10px] flex-shrink-0 mt-0.5">
                  {act.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="leading-snug break-words">
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">{act.user?.name}</strong>{' '}
                    <span className="text-slate-600 dark:text-slate-300">{act.action}</span>
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                    {timeAgo(act.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            {isTruncated && (
              <div className="mt-4 p-3 rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-accent-border)] text-center space-y-2">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  🔒 Activity history limited to 10 entries on Free tier.
                </p>
                <Link
                  to={`/org/${orgId}/settings`}
                  className="btn-primary text-[11px] py-1 px-3 inline-block"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
