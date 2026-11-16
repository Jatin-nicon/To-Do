import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIES } from '../categories';
import type { Category } from '../types';
import { CheckIcon, ChevronIcon } from './icons';

interface CategorySelectProps {
  value: Category;
  onChange: (category: Category) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  title?: string;
  variant?: 'chip' | 'picker';
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const MENU_GAP = 6;
const VIEWPORT_MARGIN = 10;
const MENU_MIN_WIDTH = 188;
const MENU_MAX_HEIGHT = 320;

function selectedIndex(value: Category): number {
  const index = CATEGORIES.findIndex((category) => category.id === value);
  return index === -1 ? 0 : index;
}

export default function CategorySelect({
  value,
  onChange,
  disabled = false,
  id,
  ariaLabel,
  title,
  variant = 'chip',
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => selectedIndex(value));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = CATEGORIES[selectedIndex(value)];

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const width = Math.max(rect.width, MENU_MIN_WIDTH);
    const spaceBelow =
      window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_MARGIN;
    const openUp = menuHeight > spaceBelow && spaceAbove > spaceBelow;
    const available = Math.max(openUp ? spaceAbove : spaceBelow, 0);
    const maxHeight = Math.min(MENU_MAX_HEIGHT, Math.max(available, 120));
    const height = Math.min(menuHeight, maxHeight);
    const top = openUp
      ? rect.top - MENU_GAP - height
      : rect.bottom + MENU_GAP;

    let left = rect.left;
    if (left + width > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - VIEWPORT_MARGIN - width;
    }

    setPosition({
      top: Math.max(VIEWPORT_MARGIN, top),
      left: Math.max(VIEWPORT_MARGIN, left),
      width,
      maxHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    menuRef.current?.focus({ preventScroll: true });
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) setActiveIndex(selectedIndex(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  function closeMenu(refocus: boolean) {
    setOpen(false);
    setPosition(null);
    if (refocus) triggerRef.current?.focus({ preventScroll: true });
  }

  function choose(category: Category) {
    onChange(category);
    closeMenu(true);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    setActiveIndex(selectedIndex(value));
    setOpen(true);
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const lastIndex = CATEGORIES.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index >= lastIndex ? 0 : index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? lastIndex : index - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(lastIndex);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(CATEGORIES[activeIndex].id);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu(true);
        break;
      case 'Tab':
        closeMenu(false);
        break;
      default:
        break;
    }
  }

  const triggerClass =
    variant === 'picker' ? 'category-picker' : 'category-select';

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${triggerClass} category-trigger cat-${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel ?? `Category: ${selected.label}`}
        title={title ?? `Category: ${selected.label}`}
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeMenu(false);
            return;
          }
          setActiveIndex(selectedIndex(value));
          setOpen(true);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="category-trigger-label">{selected.label}</span>
        <span
          className={`category-trigger-chevron${open ? ' open' : ''}`}
          aria-hidden="true"
        >
          <ChevronIcon />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            className="category-menu"
            role="listbox"
            aria-label="Category"
            aria-activedescendant={`${menuId}-${CATEGORIES[activeIndex].id}`}
            tabIndex={-1}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              minWidth: position?.width ?? MENU_MIN_WIDTH,
              maxHeight: position?.maxHeight,
              visibility: position ? 'visible' : 'hidden',
            }}
            onKeyDown={handleMenuKeyDown}
          >
            {CATEGORIES.map((option, index) => (
              <button
                key={option.id}
                id={`${menuId}-${option.id}`}
                type="button"
                role="option"
                aria-selected={option.id === value}
                tabIndex={-1}
                className={`category-menu-item cat-${option.id}${
                  index === activeIndex ? ' active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option.id)}
              >
                <span className="category-menu-dot" aria-hidden="true" />
                <span className="category-menu-label">{option.label}</span>
                {option.id === value && (
                  <span className="category-menu-check" aria-hidden="true">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
