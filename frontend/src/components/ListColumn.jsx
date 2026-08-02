import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardItem from './CardItem';
import AddCardButton from './AddCardButton';
import { TrashIcon } from './Icons';

/**
 * ListColumn
 * Sortable list column component supporting light and dark modes.
 */
export default function ListColumn({
  list,
  cards,
  onAddCard,
  onRenameList,
  onDeleteList,
  onOpenCardModal,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameText, setNameText] = useState(list.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'LIST',
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameText.trim() && nameText.trim() !== list.name) {
      onRenameList(list.id, nameText.trim());
    } else {
      setNameText(list.name);
    }
  };

  const cardIds = cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-72 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col 
                 max-h-[calc(100vh-12rem)] flex-shrink-0 shadow-sm select-none transition-colors duration-200 ${
                   isDragging ? 'ring-2 ring-[var(--color-accent)] shadow-xl z-40' : ''
                 }`}
    >
      {/* Column Header (Drag Handle for List) */}
      <div
        {...attributes}
        {...listeners}
        className="p-3.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 cursor-grab active:cursor-grabbing"
      >
        {isEditingName ? (
          <input
            type="text"
            value={nameText}
            onChange={(e) => setNameText(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameBlur();
              if (e.key === 'Escape') {
                setNameText(list.name);
                setIsEditingName(false);
              }
            }}
            className="bg-white dark:bg-slate-800 border border-[var(--color-accent)] text-slate-900 dark:text-slate-100 text-xs font-bold rounded-lg px-2 py-1 w-full focus:outline-none"
            autoFocus
          />
        ) : (
          <h3
            onClick={() => setIsEditingName(true)}
            className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-wider uppercase truncate flex-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            title="Click to rename list"
          >
            {list.name}
            <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500 normal-case bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {cards.length}
            </span>
          </h3>
        )}

        <button
          onClick={() => {
            if (confirm(`Delete list "${list.name}" and all its cards?`)) {
              onDeleteList(list.id);
            }
          }}
          className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors ml-1"
          title="Delete list"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Items Container */}
      <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5 min-h-[50px] scrollbar-thin">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onOpenModal={onOpenCardModal} />
          ))}
        </SortableContext>
      </div>

      {/* Footer Add Card */}
      <div className="p-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
        <AddCardButton onAddCard={(title) => onAddCard(list.id, title)} />
      </div>
    </div>
  );
}
