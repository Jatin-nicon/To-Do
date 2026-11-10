import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CATEGORIES, DEFAULT_CATEGORY } from '../categories';
import type { Category } from '../types';
import { CalendarIcon, PlusIcon, TagIcon } from './icons';

interface TaskFormProps {
  onAdd: (text: string, dueAt: string | null, category: Category) => Promise<boolean>;
}

export default function TaskForm({ onAdd }: TaskFormProps) {
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [category, setCategory] = useState<Category>(DEFAULT_CATEGORY);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deadlineId = useId();
  const categoryId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = text.trim();
    if (!value || submitting) {
      inputRef.current?.focus();
      return;
    }

    let dueIso: string | null = null;
    if (dueAt) {
      const dueDate = new Date(dueAt);
      if (!Number.isNaN(dueDate.getTime())) {
        dueIso = dueDate.toISOString();
      }
    }

    setSubmitting(true);
    const added = await onAdd(value, dueIso, category);
    setSubmitting(false);

    if (added) {
      setText('');
      setDueAt('');
    }
    inputRef.current?.focus();
  }

  return (
    <form className="add-card" onSubmit={handleSubmit} autoComplete="off">
      <div className="add-row">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task"
          maxLength={300}
        />
        <button
          type="submit"
          className="add-btn"
          aria-label="Add task"
          disabled={submitting}
        >
          <PlusIcon />
        </button>
      </div>

      <div className="deadline-row">
        <label className="deadline-label" htmlFor={deadlineId}>
          <CalendarIcon />
          Deadline
        </label>
        <input
          id={deadlineId}
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          aria-label="Task deadline (optional)"
        />
        {dueAt && (
          <button
            type="button"
            className="clear-deadline"
            onClick={() => setDueAt('')}
          >
            Clear
          </button>
        )}

        <label className="deadline-label category-label" htmlFor={categoryId}>
          <TagIcon />
          Category
        </label>
        <select
          id={categoryId}
          className={`category-picker cat-${category}`}
          value={category}
          onChange={(event) => setCategory(event.target.value as Category)}
          disabled={submitting}
        >
          {CATEGORIES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
