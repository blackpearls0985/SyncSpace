import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import BoardCard from '../components/BoardCard';
import { PlusIcon, LayoutDashboardIcon } from '../components/Icons';

/**
 * BoardsIndexPage — /org/:orgId/boards
 * Index page listing organization boards supporting light and dark modes.
 */
export default function BoardsIndexPage() {
  const { orgId } = useParams();
  const { currentUser, currentOrg } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const isAdmin = currentOrg?.role === 'ADMIN';

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await client.get(`/api/orgs/${orgId}/boards`);
      setBoards(data.boards);
    } catch (err) {
      setError(err.message || 'Failed to fetch boards.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setCreating(true);
    setCreateError('');

    try {
      await client.post(`/api/orgs/${orgId}/boards`, { name: boardName.trim() });
      setBoardName('');
      setShowModal(false);
      fetchBoards();
    } catch (err) {
      setCreateError(err.message || 'Failed to create board.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      await client.delete(`/api/orgs/${orgId}/boards/${boardId}`);
      fetchBoards();
    } catch (err) {
      alert(err.message || 'Failed to delete board.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <LayoutDashboardIcon className="w-7 h-7 text-[var(--color-accent)]" />
            Boards
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            Manage project boards for <strong className="text-slate-700 dark:text-slate-200">{currentOrg?.organization?.name || 'this organization'}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Create Board
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 mb-6 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Boards Grid */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-16 justify-center">
          <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          Loading boards...
        </div>
      ) : boards.length === 0 ? (
        <div className="card text-center py-20 bg-white dark:bg-slate-900">
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
            <LayoutDashboardIcon className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No boards created yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Create your first Kanban board to start organizing tasks with lists and cards.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Create Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              orgId={orgId}
              currentUserId={currentUser?.id}
              isAdmin={isAdmin}
              onDelete={handleDeleteBoard}
            />
          ))}
        </div>
      )}

      {/* Create Board Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create new board</h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Board name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Planning, Roadmap..."
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="input-field"
                  autoFocus
                />
              </div>

              {createError && (
                <p className="text-red-600 dark:text-red-400 text-xs font-medium">{createError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setBoardName(''); }}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !boardName.trim()}
                  className="btn-primary text-xs"
                >
                  {creating ? 'Creating...' : 'Create board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
