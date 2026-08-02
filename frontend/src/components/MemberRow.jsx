import React, { useState } from 'react';
import client from '../api/client';
import { TrashIcon, ShieldIcon, UserIcon } from './Icons';

/**
 * MemberRow
 * Member row component supporting light and dark modes.
 */
export default function MemberRow({ member, orgId, currentUserId, isAdmin, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSelf = member.user.id === currentUserId;

  const handleRoleChange = async (newRole) => {
    setLoading(true);
    setError('');
    try {
      await client.patch(`/api/orgs/${orgId}/members/${member.memberId}/role`, { role: newRole });
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.user.name} from this organization?`)) return;
    setLoading(true);
    setError('');
    try {
      await client.delete(`/api/orgs/${orgId}/members/${member.memberId}`);
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent-border)] 
                      flex items-center justify-center text-[var(--color-accent)] font-bold text-sm flex-shrink-0">
        {member.user.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
          {member.user.name}
          {isSelf && <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">(you)</span>}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.user.email}</p>
      </div>

      {/* Role badge / selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdmin && !isSelf ? (
          <select
            id={`role-select-${member.memberId}`}
            value={member.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={loading}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-full 
                       px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                       disabled:opacity-50 cursor-pointer font-medium"
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </select>
        ) : (
          <span className={member.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}>
            {member.role === 'ADMIN' ? (
              <><ShieldIcon className="w-3 h-3 mr-1" />Admin</>
            ) : (
              <><UserIcon className="w-3 h-3 mr-1" />Member</>
            )}
          </span>
        )}

        {/* Remove button */}
        {isAdmin && !isSelf && (
          <button
            id={`remove-member-${member.memberId}`}
            onClick={handleRemove}
            disabled={loading}
            className="btn-danger text-xs py-1.5 px-3"
            title="Remove member"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {!isAdmin && !isSelf && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Admin only</span>
        )}
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-xs col-span-full font-medium">{error}</p>}
    </div>
  );
}
