import type { Category } from './types';

export interface CategoryInfo {
  id: Category;
  label: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'general', label: 'General' },
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'study', label: 'Study' },
  { id: 'health', label: 'Health' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'errands', label: 'Errands' },
];

export const DEFAULT_CATEGORY: Category = 'general';

const categoryIds = new Set<string>(CATEGORIES.map((category) => category.id));

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && categoryIds.has(value);
}

export function categoryLabel(value: Category): string {
  return CATEGORIES.find((category) => category.id === value)?.label ?? 'General';
}
