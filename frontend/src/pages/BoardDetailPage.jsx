import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import client from '../api/client';
import { connectSocket, disconnectSocket } from '../api/socket';
import ListColumn from '../components/ListColumn';
import CardItem from '../components/CardItem';
import CardDetailModal from '../components/CardDetailModal';
import AddListButton from '../components/AddListButton';
import ActivityFeed from '../components/ActivityFeed';

function calculateNewPosition(items, overIndex) {
  if (items.length === 0) return 65535.0;
  if (overIndex <= 0) return items[0].position / 2.0;
  if (overIndex >= items.length) return items[items.length - 1].position + 65535.0;
  
  const prevPos = items[overIndex - 1].position;
  const nextPos = items[overIndex].position;
  return (prevPos + nextPos) / 2.0;
}

export default function BoardDetailPage() {
  const { orgId, boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Socket connection state
  const [isConnected, setIsConnected] = useState(false);

  // Activity Feed state
  const [activities, setActivities] = useState([]);
  const [orgTier, setOrgTier] = useState('FREE');
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  // Active item being dragged for DragOverlay
  const [activeDragItem, setActiveDragItem] = useState(null);

  // Selected card for Detail Modal
  const [selectedCard, setSelectedCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const fetchBoard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await client.get(`/api/orgs/${orgId}/boards/${boardId}`);
      setBoard(data.board);
      setOrgMembers(data.members || []);
    } catch (err) {
      setError(err.message || 'Failed to load board.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orgId, boardId]);

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const data = await client.get(`/api/orgs/${orgId}/boards/${boardId}/activity`);
      setActivities(data.activities || []);
      if (data.tier) setOrgTier(data.tier);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, [orgId, boardId]);

  useEffect(() => {
    fetchBoard();
    fetchActivities();
  }, [fetchBoard, fetchActivities]);

  // ─── Socket.io Real-time Setup & Event Listeners ───────────────────────────

  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join-board', { boardId, orgId });
      fetchBoard(true);
      fetchActivities();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('board:renamed', ({ board: updatedBoard }) => {
      setBoard((prev) => (prev ? { ...prev, name: updatedBoard.name } : prev));
    });

    socket.on('list:created', ({ list }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        if (prev.lists.some((l) => l.id === list.id)) return prev;
        return { ...prev, lists: [...prev.lists, { ...list, cards: list.cards || [] }] };
      });
    });

    socket.on('list:updated', ({ list: updatedList }) => {
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              lists: prev.lists.map((l) => (l.id === updatedList.id ? { ...l, name: updatedList.name } : l)),
            }
          : prev
      );
    });

    socket.on('list:reordered', ({ list: updatedList }) => {
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              lists: prev.lists.map((l) =>
                l.id === updatedList.id ? { ...l, position: updatedList.position } : l
              ),
            }
          : prev
      );
    });

    socket.on('list:deleted', ({ listId: deletedListId }) => {
      setBoard((prev) =>
        prev ? { ...prev, lists: prev.lists.filter((l) => l.id !== deletedListId) } : prev
      );
    });

    socket.on('card:created', ({ card, listId: targetListId }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((l) => {
            if (l.id === targetListId) {
              if (l.cards.some((c) => c.id === card.id)) return l;
              return { ...l, cards: [...l.cards, card] };
            }
            return l;
          }),
        };
      });
    });

    socket.on('card:updated', ({ card: updatedCard }) => {
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              lists: prev.lists.map((l) => ({
                ...l,
                cards: l.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
              })),
            }
          : prev
      );
    });

    socket.on('card:moved', ({ card: movedCard, previousListId }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((l) => {
            if (l.id === previousListId && l.id !== movedCard.listId) {
              return { ...l, cards: l.cards.filter((c) => c.id !== movedCard.id) };
            }
            if (l.id === movedCard.listId) {
              const exists = l.cards.some((c) => c.id === movedCard.id);
              if (exists) {
                return {
                  ...l,
                  cards: l.cards.map((c) => (c.id === movedCard.id ? movedCard : c)),
                };
              }
              return { ...l, cards: [...l.cards, movedCard] };
            }
            return l;
          }),
        };
      });
    });

    socket.on('card:deleted', ({ cardId: deletedCardId }) => {
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              lists: prev.lists.map((l) => ({
                ...l,
                cards: l.cards.filter((c) => c.id !== deletedCardId),
              })),
            }
          : prev
      );
    });

    socket.on('activity:new', (newActivity) => {
      setActivities((prev) => [newActivity, ...prev.filter((a) => a.id !== newActivity.id)]);
    });

    return () => {
      socket.emit('leave-board', { boardId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('board:renamed');
      socket.off('list:created');
      socket.off('list:updated');
      socket.off('list:reordered');
      socket.off('list:deleted');
      socket.off('card:created');
      socket.off('card:updated');
      socket.off('card:moved');
      socket.off('card:deleted');
      socket.off('activity:new');
    };
  }, [boardId, orgId, fetchBoard, fetchActivities]);

  const lists = useMemo(() => {
    return board?.lists ? [...board.lists].sort((a, b) => a.position - b.position) : [];
  }, [board]);

  const cardsByList = useMemo(() => {
    const map = {};
    if (board?.lists) {
      board.lists.forEach((list) => {
        map[list.id] = [...(list.cards || [])].sort((a, b) => a.position - b.position);
      });
    }
    return map;
  }, [board]);

  // ─── List & Card REST Actions ─────────────────────────────────────────────

  const handleAddList = async (name) => {
    try {
      const data = await client.post(`/api/orgs/${orgId}/boards/${boardId}/lists`, { name });
      setBoard((prev) => ({
        ...prev,
        lists: [...prev.lists, { ...data.list, cards: [] }],
      }));
    } catch (err) {
      alert(err.message || 'Failed to create list.');
    }
  };

  const handleRenameList = async (listId, newName) => {
    try {
      await client.patch(`/api/orgs/${orgId}/lists/${listId}`, { name: newName });
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((l) => (l.id === listId ? { ...l, name: newName } : l)),
      }));
    } catch (err) {
      alert(err.message || 'Failed to rename list.');
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      await client.delete(`/api/orgs/${orgId}/lists/${listId}`);
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.filter((l) => l.id !== listId),
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete list.');
    }
  };

  const handleAddCard = async (listId, title) => {
    try {
      const data = await client.post(`/api/orgs/${orgId}/lists/${listId}/cards`, { title });
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === listId ? { ...l, cards: [...l.cards, data.card] } : l
        ),
      }));
    } catch (err) {
      alert(err.message || 'Failed to create card.');
    }
  };

  const handleUpdateCard = async (cardId, cardData) => {
    try {
      const data = await client.patch(`/api/orgs/${orgId}/cards/${cardId}`, cardData);
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) => (c.id === cardId ? data.card : c)),
        })),
      }));
    } catch (err) {
      alert(err.message || 'Failed to update card.');
      throw err;
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await client.delete(`/api/orgs/${orgId}/cards/${cardId}`);
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((l) => ({
          ...l,
          cards: l.cards.filter((c) => c.id !== cardId),
        })),
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete card.');
      throw err;
    }
  };

  // ─── Drag and Drop Handlers ────────────────────────────────────────────────

  const handleDragStart = (event) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'LIST') {
      setActiveDragItem({ type: 'LIST', list: active.data.current.list });
    } else if (type === 'CARD') {
      setActiveDragItem({ type: 'CARD', card: active.data.current.card });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    const previousBoardState = JSON.parse(JSON.stringify(board));

    if (activeType === 'LIST') {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);

      if (oldIndex !== newIndex && newIndex !== -1) {
        const reorderedLists = arrayMove(lists, oldIndex, newIndex);
        const newPos = calculateNewPosition(reorderedLists, newIndex);

        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) => (l.id === active.id ? { ...l, position: newPos } : l)),
        }));

        try {
          await client.patch(`/api/orgs/${orgId}/lists/${active.id}/position`, {
            position: newPos,
          });
        } catch (err) {
          setBoard(previousBoardState);
          alert('Failed to persist list reordering.');
        }
      }
      return;
    }

    if (activeType === 'CARD') {
      const activeCardId = active.id;
      let activeListId = null;
      let overListId = null;
      let overCardId = null;

      for (const l of board.lists) {
        if (l.cards.some((c) => c.id === activeCardId)) {
          activeListId = l.id;
          break;
        }
      }

      if (overType === 'CARD') {
        overCardId = over.id;
        for (const l of board.lists) {
          if (l.cards.some((c) => c.id === overCardId)) {
            overListId = l.id;
            break;
          }
        }
      } else if (overType === 'LIST') {
        overListId = over.id;
      }

      if (!activeListId || !overListId) return;

      const sourceCards = cardsByList[activeListId] || [];
      const targetCards = cardsByList[overListId] || [];

      let newPos = 65535.0;

      if (activeListId === overListId) {
        const oldIndex = sourceCards.findIndex((c) => c.id === activeCardId);
        const newIndex = sourceCards.findIndex((c) => c.id === overCardId);

        if (oldIndex !== newIndex && newIndex !== -1) {
          const reorderedCards = arrayMove(sourceCards, oldIndex, newIndex);
          newPos = calculateNewPosition(reorderedCards, newIndex);

          setBoard((prev) => ({
            ...prev,
            lists: prev.lists.map((l) =>
              l.id === activeListId
                ? {
                    ...l,
                    cards: l.cards.map((c) =>
                      c.id === activeCardId ? { ...c, position: newPos } : c
                    ),
                  }
                : l
            ),
          }));

          try {
            await client.patch(`/api/orgs/${orgId}/cards/${activeCardId}/position`, {
              position: newPos,
            });
          } catch (err) {
            setBoard(previousBoardState);
            alert('Failed to persist card reordering.');
          }
        }
      } else {
        let targetIndex = targetCards.length;
        if (overCardId) {
          targetIndex = targetCards.findIndex((c) => c.id === overCardId);
        }

        newPos = calculateNewPosition(targetCards, targetIndex);
        const movedCard = sourceCards.find((c) => c.id === activeCardId);

        if (movedCard) {
          const updatedCard = { ...movedCard, listId: overListId, position: newPos };

          setBoard((prev) => ({
            ...prev,
            lists: prev.lists.map((l) => {
              if (l.id === activeListId) {
                return { ...l, cards: l.cards.filter((c) => c.id !== activeCardId) };
              }
              if (l.id === overListId) {
                return { ...l, cards: [...l.cards, updatedCard] };
              }
              return l;
            }),
          }));

          try {
            await client.patch(`/api/orgs/${orgId}/cards/${activeCardId}/position`, {
              position: newPos,
              newListId: overListId,
            });
          } catch (err) {
            setBoard(previousBoardState);
            alert('Failed to persist card cross-list move.');
          }
        }
      }
    }
  };

  const listIds = lists.map((l) => l.id);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-[#090D16] transition-colors duration-200">
      {/* Subheader */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={`/org/${orgId}/boards`}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            ← Boards
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">{board?.name || 'Loading...'}</h1>

          {/* Real-time Connection Indicator */}
          <div className="flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className={isConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
              {isConnected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowActivityFeed((v) => !v)}
            className="btn-secondary text-xs py-1.5 px-4"
          >
            <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity ({activities.length})
          </button>

          {board && (
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Created by <span className="text-slate-900 dark:text-slate-200 font-semibold">{board.createdBy?.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Area with Collapsible Activity Feed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board Container */}
        <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 py-16 justify-center">
              <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              Loading board items...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-5 items-start h-full pb-4">
                <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
                  {lists.map((list) => (
                    <ListColumn
                      key={list.id}
                      list={list}
                      cards={cardsByList[list.id] || []}
                      onAddCard={handleAddCard}
                      onRenameList={handleRenameList}
                      onDeleteList={handleDeleteList}
                      onOpenCardModal={setSelectedCard}
                    />
                  ))}
                </SortableContext>

                <AddListButton onAddList={handleAddList} />
              </div>

              <DragOverlay>
                {activeDragItem?.type === 'LIST' && (
                  <div className="w-72 bg-white dark:bg-slate-900 border-2 border-[var(--color-accent)] rounded-2xl p-4 shadow-2xl opacity-95">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{activeDragItem.list.name}</h3>
                  </div>
                )}
                {activeDragItem?.type === 'CARD' && (
                  <div className="w-64 bg-white dark:bg-slate-900 border-2 border-[var(--color-accent)] rounded-xl p-3 shadow-2xl opacity-95">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{activeDragItem.card.title}</h4>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Real-time Activity Feed Sidebar */}
        <ActivityFeed
          orgId={orgId}
          boardId={boardId}
          activities={activities}
          tier={orgTier}
          loading={loadingActivities}
          isOpen={showActivityFeed}
          onClose={() => setShowActivityFeed(false)}
        />
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          orgMembers={orgMembers}
          onClose={() => setSelectedCard(null)}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
        />
      )}
    </div>
  );
}
