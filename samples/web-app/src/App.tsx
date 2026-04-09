import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import { useTaskList } from "./hooks/useTaskList";
import { firebaseConfigError } from "./lib/firestore";

export function App() {
  if (firebaseConfigError !== null) {
    return (
      <main className="app-shell">
        <section className="hero-card">
          <p className="eyebrow">@bridgenodelabs/firestore-models sample</p>
          <h1>Web Task Sample</h1>
          <p>
            This app reads Firestore documents through the model boundary and
            adapter, so legacy schemaVersion 0 task docs still render as current
            domain objects.
          </p>
        </section>

        <p className="state state--error">
          Configuration error: {firebaseConfigError}. Add the missing values in
          samples/web-app/.env.local and restart the Vite dev server.
        </p>
      </main>
    );
  }

  const {
    tasks,
    loading,
    error,
    mutationError,
    actionTaskId,
    create,
    toggle,
    remove,
  } = useTaskList();

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">@bridgenodelabs/firestore-models sample</p>
        <h1>Web Task Sample</h1>
        <p>
          This app reads Firestore documents through the model boundary and
          adapter, so legacy schemaVersion 0 task docs still render as current
          domain objects.
        </p>
      </section>

      <TaskForm onCreate={create} />

      {loading ? (
        <p className="state">Loading tasks from Firestore...</p>
      ) : null}
      {error ? <p className="state state--error">Read error: {error}</p> : null}
      {mutationError ? (
        <p className="state state--error">Mutation error: {mutationError}</p>
      ) : null}

      <TaskList
        tasks={tasks}
        actionTaskId={actionTaskId}
        onToggle={toggle}
        onDelete={remove}
      />
    </main>
  );
}
