import type { Task } from "@/domain/entities";
import type { Dictionary } from "@/i18n/locales";
import { taskAction } from "@/app/[locale]/actions";

type TaskListProps = Readonly<{
  tasks: Task[];
  version: number;
  dictionary: Dictionary;
}>;

function HiddenTaskFields({ task, version }: Readonly<{ task: Task; version: number }>) {
  return (
    <>
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="version" value={version} />
    </>
  );
}

function TaskControls({ task, version, dictionary }: Readonly<{
  task: Task;
  version: number;
  dictionary: Dictionary;
}>) {
  if (task.deleted_at) {
    return (
      <form action={taskAction}>
        <HiddenTaskFields task={task} version={version} />
        <input type="hidden" name="kind" value="restore" />
        <button className="button quiet" type="submit">{dictionary.restore}</button>
      </form>
    );
  }
  return (
    <div className="task-actions">
      {task.status === "proposed" ? (
        <>
          <form action={taskAction}>
            <HiddenTaskFields task={task} version={version} />
            <input type="hidden" name="kind" value="transition" />
            <input type="hidden" name="status" value="pending" />
            <button className="button secondary" type="submit">{dictionary.accept}</button>
          </form>
          <form action={taskAction}>
            <HiddenTaskFields task={task} version={version} />
            <input type="hidden" name="kind" value="transition" />
            <input type="hidden" name="status" value="rejected" />
            <button className="button quiet danger" type="submit">{dictionary.reject}</button>
          </form>
        </>
      ) : null}
      {["pending", "in_progress", "waiting", "blocked", "overdue"].includes(task.status) ? (
        <form action={taskAction}>
          <HiddenTaskFields task={task} version={version} />
          <input type="hidden" name="kind" value="transition" />
          <input type="hidden" name="status" value="completed" />
          <button className="button secondary" type="submit">{dictionary.complete}</button>
        </form>
      ) : null}
      {task.status === "completed" ? (
        <form action={taskAction}>
          <HiddenTaskFields task={task} version={version} />
          <input type="hidden" name="kind" value="transition" />
          <input type="hidden" name="status" value="in_progress" />
          <button className="button secondary" type="submit">{dictionary.reopen}</button>
        </form>
      ) : null}
      <form action={taskAction}>
        <HiddenTaskFields task={task} version={version} />
        <input type="hidden" name="kind" value="tombstone" />
        <button className="button quiet" type="submit">{dictionary.remove}</button>
      </form>
    </div>
  );
}

export function TaskList({ tasks, version, dictionary }: TaskListProps) {
  const sortedTasks = [...tasks].sort((left, right) => left.position - right.position);
  const removedCount = sortedTasks.filter((task) => task.deleted_at).length;
  return (
    <section className="panel section-panel" aria-labelledby="tasks-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{dictionary.adaptivePlan}</p>
          <h2 id="tasks-title">{dictionary.tasks}</h2>
        </div>
        <span className="count-badge">{sortedTasks.length - removedCount}</span>
      </div>
      <div className="task-list">
        {sortedTasks.filter((task) => !task.deleted_at).map((task) => (
          <article className="task-row" data-testid="task-row" key={task.id}>
            <div className="task-copy">
              <div className="badge-row">
                <span className={`badge status-${task.status}`}>{dictionary.status[task.status]}</span>
                <span className="badge origin">{dictionary.origin[task.source_type]}</span>
                {task.user_confirmed ? <span className="badge confirmed">{dictionary.confirmed}</span> : null}
              </div>
              <p>{task.content}</p>
              <details>
                <summary>{dictionary.originLabel}</summary>
                <code>{task.id}</code>
                <span>{task.source_reference_ids.join(", ")}</span>
              </details>
            </div>
            <form className="task-edit" action={taskAction}>
              <HiddenTaskFields task={task} version={version} />
              <input type="hidden" name="kind" value="edit" />
              <label className="sr-only" htmlFor={`edit-${task.id}`}>{dictionary.editTask}</label>
              <input id={`edit-${task.id}`} name="content" defaultValue={task.content} />
              <button className="button quiet" type="submit">{dictionary.saveEdit}</button>
            </form>
            <TaskControls task={task} version={version} dictionary={dictionary} />
          </article>
        ))}
      </div>
      <form className="inline-form add-task-form" action={taskAction}>
        <input type="hidden" name="kind" value="add" />
        <input type="hidden" name="version" value={version} />
        <label className="sr-only" htmlFor="new-task">{dictionary.newTask}</label>
        <input id="new-task" name="content" placeholder={dictionary.newTask} required />
        <button className="button secondary" type="submit">{dictionary.addTask}</button>
      </form>
      {removedCount > 0 ? (
        <details className="removed-tasks">
          <summary>{dictionary.removedTasks}: {removedCount}</summary>
          {sortedTasks.filter((task) => task.deleted_at).map((task) => (
            <div className="removed-row" key={task.id}>
              <span>{task.content}</span>
              <TaskControls task={task} version={version} dictionary={dictionary} />
            </div>
          ))}
        </details>
      ) : null}
    </section>
  );
}
