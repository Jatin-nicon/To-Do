import { CATEGORIES } from '../categories';
import type { Category } from '../types';

export type CategoryFilterValue = Category | 'all';

interface CategoryFilterProps {
  value: CategoryFilterValue;
  counts: Record<CategoryFilterValue, number>;
  onChange: (value: CategoryFilterValue) => void;
}

export default function CategoryFilter({
  value,
  counts,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="category-filter" role="group" aria-label="Filter tasks by category">
      <button
        type="button"
        className="category-filter-chip cat-all"
        aria-pressed={value === 'all'}
        onClick={() => onChange('all')}
      >
        All categories
        <span className="filter-count">{counts.all}</span>
      </button>

      {CATEGORIES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`category-filter-chip cat-${id}`}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {label}
          <span className="filter-count">{counts[id]}</span>
        </button>
      ))}
    </div>
  );
}
