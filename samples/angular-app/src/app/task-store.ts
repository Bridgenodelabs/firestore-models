import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import {
  Timestamp,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";

import { readDocumentDomain } from "@bridgenodelabs/firestore-models/adapters/firebase-client";

import { tasksCollection } from "../lib/firestore";
import { taskModel, type Task, type TaskPriority } from "../models/task";

export interface TaskWithId extends Task {
  id: string;
}

export interface CreateTaskInput {
  title: string;
  dueAt?: Date;
  priority: TaskPriority;
}

/**
 * Signal-backed equivalent of the React sample's `useTaskList` hook.
 *
 * The library ships React hooks at `@bridgenodelabs/firestore-models/react`,
 * but nothing Angular-specific — and it does not need to. The hooks are a thin
 * convenience over the framework-agnostic pieces, so this service reaches for
 * those directly:
 *
 *   - `readDocumentDomain` from `/adapters/firebase-client` to cross the
 *     persisted → domain boundary, including migration-on-read
 *   - `taskModel` from the shared sample model for `toPersisted`
 *
 * Everything Angular-flavoured (subscription lifetime, change detection) is
 * handled here with signals, which is why this app runs zoneless.
 */
@Injectable({ providedIn: "root" })
export class TaskStore {
  private readonly destroyRef = inject(DestroyRef);

  private readonly tasksSignal = signal<TaskWithId[]>([]);
  private readonly loadingSignal = signal(true);
  private readonly errorSignal = signal<string | null>(null);
  private readonly mutationErrorSignal = signal<string | null>(null);
  private readonly actionTaskIdSignal = signal<string | null>(null);

  readonly tasks = this.tasksSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly mutationError = this.mutationErrorSignal.asReadonly();
  readonly actionTaskId = this.actionTaskIdSignal.asReadonly();

  constructor() {
    if (tasksCollection === null) {
      this.loadingSignal.set(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(tasksCollection),
      (snapshot) => {
        const documents: TaskWithId[] = [];
        const failures: string[] = [];

        for (const documentSnapshot of snapshot.docs) {
          try {
            // Migration-on-read happens here: a schemaVersion 0 document is
            // upgraded by the model's migrations before it ever reaches the UI.
            const domain = readDocumentDomain(documentSnapshot, taskModel);
            documents.push({ id: documentSnapshot.id, ...domain });
          } catch (cause) {
            failures.push(`${documentSnapshot.id}: ${describeError(cause)}`);
          }
        }

        this.tasksSignal.set(documents);
        this.errorSignal.set(
          failures.length > 0
            ? `Skipped ${failures.length} unreadable document(s) — ${failures.join("; ")}`
            : null,
        );
        this.loadingSignal.set(false);
      },
      (cause) => {
        this.errorSignal.set(describeError(cause));
        this.loadingSignal.set(false);
      },
    );

    this.destroyRef.onDestroy(unsubscribe);
  }

  async create(input: CreateTaskInput): Promise<void> {
    const collectionRef = this.requireCollection();
    this.mutationErrorSignal.set(null);

    const title = input.title.trim();
    if (title.length === 0) {
      this.mutationErrorSignal.set("Task title is required");
      return;
    }

    try {
      // `toTimestamp` is required whenever the domain object carries a Date —
      // it is what keeps `core` free of any Firebase SDK import.
      const persisted = taskModel.toPersisted(
        { title, done: false, dueAt: input.dueAt, priority: input.priority },
        Timestamp.fromDate,
      );

      await addDoc(collectionRef, persisted);
    } catch (cause) {
      this.mutationErrorSignal.set(describeError(cause));
    }
  }

  async toggle(task: TaskWithId): Promise<void> {
    const collectionRef = this.requireCollection();
    this.mutationErrorSignal.set(null);
    this.actionTaskIdSignal.set(task.id);

    try {
      await updateDoc(doc(collectionRef, task.id), { done: !task.done });
    } catch (cause) {
      this.mutationErrorSignal.set(describeError(cause));
    } finally {
      this.actionTaskIdSignal.set(null);
    }
  }

  async remove(taskId: string): Promise<void> {
    const collectionRef = this.requireCollection();
    this.mutationErrorSignal.set(null);
    this.actionTaskIdSignal.set(taskId);

    try {
      await deleteDoc(doc(collectionRef, taskId));
    } catch (cause) {
      this.mutationErrorSignal.set(describeError(cause));
    } finally {
      this.actionTaskIdSignal.set(null);
    }
  }

  private requireCollection() {
    if (tasksCollection === null) {
      throw new Error("Firestore is not configured; check src/environments.");
    }

    return tasksCollection;
  }
}

function describeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
