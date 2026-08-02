import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { PlusIcon, BuildingOffice2Icon, SettingsIcon, LayoutDashboardIcon } from '../components/Icons';

/**
 * DashboardPage — /dashboard
 * Dashboard supporting light and dark modes with bold typography and coral accent elements.
 */
export default function DashboardPage() {
  const { currentUser, refreshUser } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const orgs = currentUser?.orgs ?? [];

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      await client.post('/api/orgs', { name: orgName.trim() });
      await refreshUser();
      setOrgName('');
      setShowCreateForm(false);
      setSuccess('Organization created! You are now the admin.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back, {currentUser?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
            {orgs.length === 0
              ? 'Create your first organization to get started.'
              : `You belong to ${orgs.length} organization${orgs.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <button
          id="create-org-toggle-btn"
          onClick={() => { setShowCreateForm((v) => !v); setError(''); }}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          New Organization
        </button>
      </div>

      {/* Feedback messages */}
      {success && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl px-4 py-3">
          <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Create org form */}
      {showCreateForm && (
        <div className="card mb-8 border-[var(--color-accent-border)] bg-[var(--color-accent-light)]/40 dark:bg-slate-900/90">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Create a new organization</h2>
          <form onSubmit={handleCreateOrg} className="flex flex-col sm:flex-row gap-3">
            <input
              id="org-name-input"
              type="text"
              placeholder="e.g. Acme Corp, My Startup..."
              value={orgName}
              onChange={(e) => { setOrgName(e.target.value); setError(''); }}
              className="input-field flex-1"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                id="create-org-submit-btn"
                type="submit"
                disabled={creating || !orgName.trim()}
                className="btn-primary whitespace-nowrap"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
          {error && <p className="text-red-600 dark:text-red-400 text-sm mt-3 font-medium">{error}</p>}
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-3">
            You will automatically become the <strong className="text-slate-700 dark:text-slate-200">Admin</strong> of this organization.
          </p>
        </div>
      )}

      {/* Org cards grid */}
      {orgs.length === 0 ? (
        <div className="card text-center py-20 bg-white dark:bg-slate-900">
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
            <BuildingOffice2Icon className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No organizations yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Create your first organization or ask an admin to invite you.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Create Organization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((membership) => (
            <div
              key={membership.organization.id}
              className="card bg-white dark:bg-slate-900 hover:border-[var(--color-accent-border)] transition-all duration-200 
                         group flex flex-col justify-between hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-accent-border)]
                                  flex items-center justify-center text-[var(--color-accent)] font-extrabold text-xl shadow-xs">
                    {membership.organization.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={membership.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}>
                    {membership.role === 'ADMIN' ? '⚡ Admin' : 'Member'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl mb-1 truncate group-hover:text-[var(--color-accent)] transition-colors">
                  {membership.organization.name}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mb-5">
                  Joined {new Date(membership.joinedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <Link
                  to={`/org/${membership.organization.id}/boards`}
                  className="btn-primary text-xs py-1.5 px-4"
                >
                  <LayoutDashboardIcon className="w-3.5 h-3.5" />
                  View Boards
                </Link>

                <Link
                  to={`/org/${membership.organization.id}/settings`}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 
                             font-medium transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
