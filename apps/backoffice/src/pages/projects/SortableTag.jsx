import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const chipCls =
  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-green-900/40 border border-blue-300 dark:border-green-700 text-blue-800 dark:text-green-200';
const deleteBtnCls =
  'text-blue-600 dark:text-green-400 hover:text-blue-800 dark:hover:text-green-300 -mr-0.5 cursor-pointer';

export function SortableTag({ id, label, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      className={chipCls}
      {...attributes}
      {...listeners}
    >
      {label}
      <button
        type="button"
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        className={deleteBtnCls}
        aria-label="태그 제거"
      >
        ×
      </button>
    </span>
  );
}
