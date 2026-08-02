import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, BuildingOffice2Icon, CheckIcon } from './Icons';
import { useAuth } from '../context/AuthContext';

/**
 * OrgSwitcher
 * Dropdown for organization selection supporting light and dark modes.
 */
export default function OrgSwitcher() {
  const { currentUser, currentOrg, switchOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const orgs = currentUser?.orgs ?? [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (orgs.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        id="org-switcher-btn"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 
                   border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-xs font-semibold 
                   text-slate-800 dark:text-slate-200 transition-colors duration-150"
      >
        <BuildingOffice2Icon className="w-3.5 h-3.5 text-[var(--color-accent)]" />
        <span className="max-w-[130px] truncate">
          {currentOrg?.organization?.name ?? 'Select org'}
        </span>
        {currentOrg?.role === 'ADMIN' && (
          <span className="badge-admin text-[10px] py-0 px-2">Admin</span>
        )}
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                        rounded-2xl shadow-xl py-1.5 z-50 animate-in slide-in-from-top-1">
          <p className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Your organizations
          </p>
          {orgs.map((membership) => (
            <button
              key={membership.organization.id}
              onClick={() => {
                switchOrg(membership);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200
                         hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-100 text-left"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent-border)] 
                              flex items-center justify-center text-[var(--color-accent)] text-xs font-bold flex-shrink-0">
                {membership.organization.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{membership.organization.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{membership.role.toLowerCase()}</p>
              </div>
              {currentOrg?.organization?.id === membership.organization.id && (
                <CheckIcon className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
