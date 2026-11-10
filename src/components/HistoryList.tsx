import type { HistoryEntry } from '../types';
import HistoryItem from './HistoryItem';

interface HistoryListProps {
  entries: HistoryEntry[];
  onRestore?: (id: string) => void;
  canRestore?: (entry: HistoryEntry) => boolean;
}

export default function HistoryList({
  entries,
  onRestore,
  canRestore,
}: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="empty small">
        <p>No completed tasks yet</p>
        <span>Check off a task and it will be saved here.</span>
      </div>
    );
  }

  return (
    <ul className="history-list">
      {entries.map((entry) => (
        <HistoryItem
          key={entry.id}
          entry={entry}
          onRestore={
            onRestore && (!canRestore || canRestore(entry))
              ? () => onRestore(entry.id)
              : undefined
          }
        />
      ))}
    </ul>
  );
}
