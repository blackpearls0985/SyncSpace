import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import MemberRow from '../components/MemberRow';
import { MailIcon, ShieldIcon } from '../components/Icons';

/**
 * OrgSettingsPage — /org/:orgId/settings
 * Features org member management, email invitations, and Stripe Subscription & Billing management.
 */
export default function OrgSettingsPage() {
  const { orgId } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [org, setOrg] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState('');

  // Stripe Billing states
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [upgradedBanner, setUpgradedBanner] = useState(searchParams.get('upgraded') === 'true');

  const myMembership = currentUser?.orgs?.find((o) => o.organization.id === orgId);
  const isAdmin = myMembership?.role === 'ADMIN';

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    setFetchError('');
    try {
      const data = await client.get(`/api/orgs/${orgId}/members`);
      setMembers(data.members);
      setOrg(myMembership?.organization ?? null);
    } catch (err) {
      setFetchError(err.message);
      if (err.message.includes('not a member')) {
        navigate('/dashboard');
      }
    } finally {
      setLoadingMembers(false);
    }
  }, [orgId, myMembership, navigate]);

  useEffect(() => {
    if (!myMembership) {
      navigate('/dashboard');
      return;
    }
    fetchMembers();
  }, [orgId, fetchMembers, myMembership, navigate]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');
    setInviteResult(null);

    try {
      const data = await client.post(`/api/orgs/${orgId}/members/invite`, {
        email: inviteEmail.trim(),
      });
      setInviteResult(data);
      setInviteEmail('');
      fetchMembers();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setBillingLoading(true);
    setBillingError('');
    try {
      const data = await client.post(`/api/orgs/${orgId}/billing/checkout`);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setBillingError(err.message || 'Failed to create checkout session.');
      setBillingLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setBillingLoading(true);
    setBillingError('');
    try {
      const data = await client.post(`/api/orgs/${orgId}/billing/portal`);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setBillingError(err.message || 'Failed to initiate Customer Portal session.');
      setBillingLoading(false);
    }
  };

  const currentTier = org?.tier || 'FREE';
  const subStatus = org?.subscriptionStatus || (currentTier === 'PRO' ? 'active' : 'none');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Organization Settings</p>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {org?.name ?? 'Loading...'}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={isAdmin ? 'badge-admin' : 'badge-member'}>
            {isAdmin ? (
              <><ShieldIcon className="w-3 h-3 mr-1" />Admin</>
            ) : (
              'Member'
            )}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-xs">— your role in this org</span>
        </div>
      </div>

      {upgradedBanner && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-emerald-800 dark:text-emerald-300 text-sm font-bold">🎉 Checkout Completed!</p>
            <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
              Stripe will send a webhook event in the background to update your organization status to PRO.
            </p>
          </div>
          <button
            onClick={() => setUpgradedBanner(false)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Subscription & Billing Section */}
      <div className="card bg-white dark:bg-slate-900 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent-border)] flex items-center justify-center text-[var(--color-accent)] font-bold text-xs">
                ★
              </span>
              Subscription & Plan
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Current Tier: <strong className="text-slate-900 dark:text-slate-100 font-bold">{currentTier}</strong>
              {subStatus !== 'none' && (
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-normal">({subStatus})</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentTier === 'FREE' ? (
              <button
                onClick={handleUpgradeToPro}
                disabled={!isAdmin || billingLoading}
                className="btn-primary text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isAdmin ? 'Only admins can upgrade plan' : ''}
              >
                {billingLoading ? 'Redirecting...' : 'Upgrade to Pro ($19/mo)'}
              </button>
            ) : (
              <button
                onClick={handleManageSubscription}
                disabled={!isAdmin || billingLoading}
                className="btn-secondary text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isAdmin ? 'Only admins can manage subscription' : ''}
              >
                {billingLoading ? 'Opening Portal...' : 'Manage Subscription'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Plan Comparison:</p>
          <p>• <strong>Free Tier:</strong> Unlimited boards & cards, activity feed truncated to last 10 actions.</p>
          <p>• <strong>Pro Tier ($19/mo):</strong> Full activity feed history (50 entries), priority features.</p>
        </div>

        {!isAdmin && (
          <p className="text-amber-600 dark:text-amber-400 text-xs mt-3 flex items-center gap-1 font-medium">
            <ShieldIcon className="w-3.5 h-3.5" />
            Only organization Admins can manage billing or upgrade plans.
          </p>
        )}

        {billingError && (
          <div className="mt-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3">
            <p className="text-red-600 dark:text-red-400 text-xs font-medium">{billingError}</p>
          </div>
        )}
      </div>

      {/* Invite section */}
      <div className="card bg-white dark:bg-slate-900 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-lg">
              <MailIcon className="w-4 h-4 text-[var(--color-accent)]" />
              Invite a member
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {isAdmin
                ? 'Enter an email address to invite them to this organization.'
                : 'Only admins can invite members.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            id="invite-email-input"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); setInviteResult(null); }}
            disabled={!isAdmin || inviting}
            className="input-field flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            id="invite-submit-btn"
            type="submit"
            disabled={!isAdmin || inviting || !inviteEmail.trim()}
            className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isAdmin ? 'Only admins can invite members' : ''}
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>

        {inviteError && (
          <div className="mt-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3">
            <p className="text-red-600 dark:text-red-400 text-xs font-medium">{inviteError}</p>
          </div>
        )}

        {inviteResult && (
          <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl px-4 py-3">
            <p className="text-emerald-700 dark:text-emerald-400 text-xs font-medium">{inviteResult.message}</p>
            {inviteResult.inviteLink && (
              <div className="mt-2">
                <p className="text-slate-600 dark:text-slate-400 text-xs mb-1">
                  Share this invite link (also logged to backend console):
                </p>
                <code className="text-[var(--color-accent)] text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 break-all block font-mono">
                  {inviteResult.inviteLink}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member list */}
      <div className="card bg-white dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">
          Members
          {members.length > 0 && (
            <span className="ml-2 text-sm text-slate-400 dark:text-slate-500 font-normal">({members.length})</span>
          )}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {isAdmin
            ? 'You can change roles and remove members below.'
            : 'You can view members. Only admins can manage roles or remove members.'}
        </p>

        {loadingMembers ? (
          <div className="flex items-center gap-2 py-8 justify-center text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            Loading members...
          </div>
        ) : fetchError ? (
          <p className="text-red-600 dark:text-red-400 text-sm py-4">{fetchError}</p>
        ) : members.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-4">No members yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((member) => (
              <MemberRow
                key={member.memberId}
                member={member}
                orgId={orgId}
                currentUserId={currentUser?.id}
                isAdmin={isAdmin}
                onUpdate={fetchMembers}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
