import { taskAction } from "@/app/[locale]/actions";
import type { Task } from "@/domain/entities";
import type { Dictionary, Locale } from "@/i18n/locales";

type TaskListProps = Readonly<{
  tasks: Task[];
  version: number;
  currentTaskId: string | null;
  locale: Locale;
  dictionary: Dictionary;
}>;

function HiddenTaskFields({ task, version, locale }: Readonly<{
  task: Task;
  version: number;
  locale: Locale;
}>) {
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="version" value={version} />
    </>
  );
}

function TaskControls({ task, version, locale, dictionary }: Readonly<{
  task: Task;
  version: number;
  locale: Locale;
  dictionary: Dictionary;
}>) {
  if (task.deleted_at) {
    return (
      <form action={taskAction}>
        <HiddenTaskFields task={task} version={version} locale={locale} />
        <input type="hidden" name="kind" value="restore" />
        <button className="button quiet" type="submit">{dictionary.restore}</button>
      </form>
    );
  }

  const canComplete = task.status === "pending"
    || task.status === "in_progress"
    || task.status === "waiting"
    || task.status === "blocked"
    || task.status === "overdue";

  return (
    <div className="task-control-stack">
      <form className="task-edit" action={taskAction}>
        <HiddenTaskFields task={task} version={version} locale={locale} />
        <input type="hidden" name="kind" value="edit" />
        <label htmlFor={`edit-${task.id}`}>{dictionary.editTask}</label>
        <input id={`edit-${task.id}`} name="content" defaultValue={task.content} />
        <button className="button secondary" type="submit">{dictionary.saveEdit}</button>
      </form>
      <div className="task-actions">
        {task.status === "proposed" ? (
          <>
            <form action={taskAction}>
              <HiddenTaskFields task={task} version={version} locale={locale} />
              <input type="hidden" name="kind" value="transition" />
              <input type="hidden" name="status" value="pending" />
              <button className="button secondary" type="submit">{dictionary.accept}</button>
            </form>
            <form action={taskAction}>
              <HiddenTaskFields task={task} version={version} locale={locale} />
              <input type="hidden" name="kind" value="transition" />
              <input type="hidden" name="status" value="rejected" />
              <button className="button quiet danger" type="submit">{dictionary.reject}</button>
            </form>
          </>
        ) : null}
        {canComplete ? (
          <form action={taskAction}>
            <HiddenTaskFields task={task} version={version} locale={locale} />
            <input type="hidden" name="kind" value="transition" />
            <input type="hidden" name="status" value="completed" />
            <button className="button secondary" type="submit">{dictionary.complete}</button>
          </form>
        ) : null}
        {task.status === "completed" ? (
          <form action={taskAction}>
            <HiddenTaskFields task={task} version={version} locale={locale} />
            <input type="hidden" name="kind" value="transition" />
            <input type="hidden" name="status" value="in_progress" />
            <button className="button secondary" type="submit">{dictionary.reopen}</button>
          </form>
        ) : null}
        <form action={taskAction}>
          <HiddenTaskFields task={task} version={version} locale={locale} />
          <input type="hidden" name="kind" value="tombstone" />
          <button className="button quiet danger" type="submit">{dictionary.remove}</button>
        </form>
      </div>
      <div className="technical-content">
        <code>{task.id}</code>
        <code>{task.source_reference_ids.join(", ")}</code>
      </div>
    </div>
  );
}

export function TaskList({ tasks, version, currentTaskId, locale, dictionary }: TaskListProps) {
  const sortedTasks = [...tasks].sort((left, right) => left.position - right.position);
  const visibleTasks = sortedTasks.filter((task) => !task.deleted_at);
  const removedTasks = sortedTasks.filter((task) => task.deleted_at);

  return (
    <section className="plan-panel" aria-labelledby="tasks-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{dictionary.adaptivePlan}</p>
          <h2 id="tasks-title">{dictionary.tasks}</h2>
        </div>
        <span className="count-badge">{visibleTasks.length}</span>
      </div>
      <div className="task-list">
        {visibleTasks.map((task, index) => (
          <article
            className={`task-row status-row-${task.status}`}
            data-testid="task-row"
            key={task.id}
          >
            <span className="task-index" aria-hidden="true">{index + 1}</span>
            <div className="task-copy">
              <div className="badge-row">
                {task.id === currentTaskId ? <span className="badge now-badge">{dictionary.now}</span> : null}
                <span className={`badge status-${task.status}`}>{dictionary.status[task.status]}</span>
                <span className="badge origin">{dictionary.origin[task.source_type]}</span>
              </div>
              <p>{task.content}</p>
            </div>
            <details className="task-details">
              <summary aria-label={`${dictionary.taskOptions}: ${task.content}`}>•••</summary>
              <div className="task-details-panel">
                <TaskControls task={task} version={version} locale={locale} dictionary={dictionary} />
              </div>
            </details>
          </article>
        ))}
      </div>
      <form className="inline-form add-task-form" action={taskAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="kind" value="add" />
        <input type="hidden" name="version" value={version} />
        <label className="sr-only" htmlFor="new-task">{dictionary.newTask}</label>
        <input id="new-task" name="content" placeholder={dictionary.newTask} required />
        <button className="button secondary" type="submit">{dictionary.addTask}</button>
      </form>
      {removedTasks.length > 0 ? (
        <details className="removed-tasks">
          <summary>{dictionary.removedTasks}: {removedTasks.length}</summary>
          {removedTasks.map((task) => (
            <div className="removed-row" key={task.id}>
              <span>{task.content}</span>
              <TaskControls task={task} version={version} locale={locale} dictionary={dictionary} />
            </div>
          ))}
        </details>
      ) : null}
    </section>
  );
}
