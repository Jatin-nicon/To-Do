import { useState } from 'react';
import { CATEGORIES, categoryLabel } from '../categories';
import type {
  Category,
  Task,
  TaskComment,
  TaskFilter,
  Team,
  TeamTab,
  UserProfile,
} from '../types';
import CategoryFilter from './CategoryFilter';
import type { CategoryFilterValue } from './CategoryFilter';
import FilterTabs from './FilterTabs';
import HistoryList from './HistoryList';
import MembersPanel from './MembersPanel';
import TeamTaskForm from './TeamTaskForm';
import TaskList from './TaskList';
import { ListIcon, UsersIcon } from './icons';

function deadlineValue(task: Task): number {
  if (!task.dueAt) return Number.POSITIVE_INFINITY;
  const time = new Date(task.dueAt).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function isOverdue(task: Task, now: number): boolean {
  if (!task.dueAt) return false;
  const time = new Date(task.dueAt).getTime();
  return !Number.isNaN(time) && time < now;
}

interface TeamViewProps {
  team: Team;
  user: UserProfile;
  loading: boolean;
  filter: TaskFilter;
  tab: TeamTab;
  now: number;
  onTabChange: (tab: TeamTab) => void;
  onFilterChange: (filter: TaskFilter) => void;
  onRefresh: () => void;
  onAddTask: (
    text: string,
    dueAt: string | null,
    assigneeEmail: string,
    category: Category,
  ) => Promise<boolean>;
  onCompleteTask: (id: string) => void;
  onRestoreTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCategoryChange: (id: string, category: Category) => void;
  onAddComment: (
    taskId: string,
    text: string,
    progress: number,
  ) => Promise<boolean>;
  onDeleteComment: (taskId: string, commentId: string) => void;
  onClearHistory: () => void;
  onInvite: (email: string) => Promise<boolean>;
  onRemoveMember: (email: string) => Promise<boolean>;
  onDeleteTeam: () => void;
}

export default function TeamView({
  team,
  user,
  loading,
  filter,
  tab,
  now,
  onTabChange,
  onFilterChange,
  onRefresh,
  onAddTask,
  onCompleteTask,
  onRestoreTask,
  onDeleteTask,
  onCategoryChange,
  onAddComment,
  onDeleteComment,
  onClearHistory,
  onInvite,
  onRemoveMember,
  onDeleteTeam,
}: TeamViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>('all');

  const currentEmail = user.email.toLowerCase();
  const isOwner =
    team.ownerSub === user.sub || team.ownerEmail === currentEmail;
  const owner =
    team.members.find(
      (member) => member.role === 'owner' || member.email === team.ownerEmail,
    ) ?? null;
  const ownerName = owner?.name ?? owner?.email ?? team.ownerEmail;

  function isSamePerson(ref: { sub: string | null; email: string } | null | undefined) {
    if (!ref) return false;
    return ref.sub === user.sub || ref.email.toLowerCase() === currentEmail;
  }

  function canCompleteTask(task: Task): boolean {
    return isOwner || isSamePerson(task.author) || isSamePerson(task.assignee);
  }

  function canRestoreTask(entry: Task): boolean {
    return isOwner || isSamePerson(entry.author) || isSamePerson(entry.assignee);
  }

  function canDeleteTask(task: Task): boolean {
    return isOwner || isSamePerson(task.author);
  }

  function canDeleteComment(_task: Task, comment: TaskComment): boolean {
    return isOwner || isSamePerson(comment.author);
  }

  const categoryTasks = team.tasks.filter(
    (task) => categoryFilter === 'all' || task.category === categoryFilter,
  );
  const categoryHistory = team.history.filter(
    (entry) => categoryFilter === 'all' || entry.category === categoryFilter,
  );

  const orderedTasks = [...categoryTasks].sort(
    (first, second) => deadlineValue(first) - deadlineValue(second),
  );
  const pendingTasks = orderedTasks.filter((task) => !isOverdue(task, now));
  const overdueTasks = orderedTasks.filter((task) => isOverdue(task, now));

  const counts: Record<TaskFilter, number> = {
    all: categoryTasks.length + categoryHistory.length,
    pending: pendingTasks.length,
    overdue: overdueTasks.length,
    completed: categoryHistory.length,
  };

  const categoryCounts = CATEGORIES.reduce(
    (totals, category) => {
      totals[category.id] =
        team.tasks.filter((task) => task.category === category.id).length +
        team.history.filter((entry) => entry.category === category.id).length;
      return totals;
    },
    {
      all: team.tasks.length + team.history.length,
    } as Record<CategoryFilterValue, number>,
  );

  const visibleTasks =
    filter === 'pending'
      ? pendingTasks
      : filter === 'overdue'
        ? overdueTasks
        : orderedTasks;

  const activePanelTitle =
    filter === 'pending' ? 'Pending' : filter === 'overdue' ? 'Overdue' : 'Team tasks';

  const emptyTitle =
    filter === 'pending'
      ? 'Nothing pending'
      : filter === 'overdue'
        ? 'No overdue tasks'
        : 'No team tasks yet';

  const emptyMessage =
    categoryFilter !== 'all'
      ? `No ${categoryLabel(categoryFilter).toLowerCase()} tasks here yet.`
      : filter === 'pending'
        ? 'No upcoming team tasks right now.'
        : filter === 'overdue'
          ? 'The team is on schedule.'
          : 'Add the first shared task above and assign it to a teammate.';

  const showActivePanel = filter !== 'completed';
  const showHistoryPanel = filter === 'all' || filter === 'completed';

  return (
    <div className="team-view">
      <section className="team-header" aria-labelledby="team-heading">
        <div className="team-heading">
          <span className="team-eyebrow">Shared workspace</span>
          <h2 id="team-heading">{team.name}</h2>
          <p className="team-subtitle">
            {team.members.length} member{team.members.length === 1 ? '' : 's'} · Owner{' '}
            {ownerName}
          </p>
        </div>

        <div className="team-header-actions">
          <span className={`role-badge ${isOwner ? 'owner' : 'member'}`}>
            {isOwner ? 'Owner' : 'Member'}
          </span>
          <button
            type="button"
            className="ghost-btn refresh-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      <div className="team-tabs" role="group" aria-label="Team sections">
        <button
          type="button"
          className="team-tab"
          aria-pressed={tab === 'tasks'}
          onClick={() => onTabChange('tasks')}
        >
          <ListIcon />
          Team tasks
          <span className="filter-count">{team.tasks.length + team.history.length}</span>
        </button>
        <button
          type="button"
          className="team-tab"
          aria-pressed={tab === 'members'}
          onClick={() => onTabChange('members')}
        >
          <UsersIcon />
          Members
          <span className="filter-count">{team.members.length}</span>
        </button>
      </div>

      {tab === 'members' ? (
        <MembersPanel
          team={team}
          currentUser={user}
          onInvite={onInvite}
          onRemove={onRemoveMember}
          onDeleteTeam={onDeleteTeam}
        />
      ) : (
        <>
          <TeamTaskForm
            members={team.members}
            currentUserEmail={currentEmail}
            onAdd={onAddTask}
          />

          <FilterTabs value={filter} counts={counts} onChange={onFilterChange} />

          <CategoryFilter
            value={categoryFilter}
            counts={categoryCounts}
            onChange={setCategoryFilter}
          />

          {showActivePanel && (
            <section className="panel" aria-labelledby="team-tasks-heading">
              <div className="panel-head">
                <h2 id="team-tasks-heading">{activePanelTitle}</h2>
                <span className="count" aria-live="polite">
                  {visibleTasks.length}
                </span>
              </div>

              <TaskList
                tasks={visibleTasks}
                onComplete={onCompleteTask}
                onDelete={onDeleteTask}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onCategoryChange={onCategoryChange}
                canCompleteTask={canCompleteTask}
                canDeleteTask={canDeleteTask}
                canEditCategoryTask={canCompleteTask}
                canDeleteComment={canDeleteComment}
                emptyTitle={emptyTitle}
                emptyMessage={emptyMessage}
              />
            </section>
          )}

          {showHistoryPanel && (
            <section className="panel" aria-labelledby="team-history-heading">
              <div className="panel-head">
                <h2 id="team-history-heading">
                  {filter === 'completed' ? 'Completed' : 'Team history'}
                </h2>
                <div className="head-actions">
                  <span className="count" aria-live="polite">
                    {categoryHistory.length}
                  </span>
                  {isOwner && categoryHistory.length > 0 && (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={onClearHistory}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <HistoryList
                entries={categoryHistory}
                onRestore={onRestoreTask}
                canRestore={canRestoreTask}
              />
            </section>
          )}

          <p className="team-hint">
            Everyone on this team can see these tasks and post progress updates. Only the
            task owner, its assignee, or the team owner can complete or restore a task.
          </p>
        </>
      )}
    </div>
  );
}
