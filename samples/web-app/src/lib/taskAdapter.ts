import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import {
  readDocumentDomain,
  type BrowserDocumentSnapshot,
} from "firestore-type/adapters/firebase-client";

import { firebaseConfigError, tasksCollection } from "./firestore";
import {
  taskModel,
  type Task,
  type TaskPersistedV1,
  type TaskPriority,
} from "../models/task";

export interface TaskWithId extends Task {
  id: string;
}

export interface CreateTaskInput {
  title: string;
  dueAt?: Date;
  priority: TaskPriority;
}

function getFirebaseConfigErrorMessage(): string {
  return firebaseConfigError ?? "Firebase configuration is invalid";
}

function requireTasksCollection() {
  if (tasksCollection === null) {
    throw new Error(getFirebaseConfigErrorMessage());
  }

  return tasksCollection;
}

function snapshotToTask(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): TaskWithId {
  const task = readDocumentDomain(
    snapshot as BrowserDocumentSnapshot<DocumentData>,
    taskModel,
  );

  return {
    id: snapshot.id,
    ...task,
  };
}

function toPersistedTask(task: Task): TaskPersistedV1 {
  return taskModel.toPersisted(task, Timestamp.fromDate);
}

export function subscribeToTasks(
  onNext: (tasks: TaskWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (tasksCollection === null) {
    queueMicrotask(() => {
      onError(new Error(getFirebaseConfigErrorMessage()));
    });

    return () => {
      // No-op unsubscribe for invalid config mode.
    };
  }

  return onSnapshot(
    query(tasksCollection),
    (snapshot) => {
      onNext(snapshot.docs.map((docSnapshot) => snapshotToTask(docSnapshot)));
    },
    (error) => {
      onError(error);
    },
  );
}

export async function createTask(input: CreateTaskInput): Promise<string> {
  const trimmedTitle = input.title.trim();

  if (!trimmedTitle) {
    throw new Error("Task title is required");
  }

  const task: Task = {
    title: trimmedTitle,
    done: false,
    dueAt: input.dueAt,
    priority: input.priority,
  };

  const persistedTask = toPersistedTask(task);
  const created = await addDoc(requireTasksCollection(), persistedTask);

  return created.id;
}

export async function toggleTaskDone(task: TaskWithId): Promise<void> {
  const collectionRef = requireTasksCollection();

  await updateDoc(doc(collectionRef, task.id), {
    done: !task.done,
  });
}

export async function deleteTaskById(taskId: string): Promise<void> {
  await deleteDoc(doc(requireTasksCollection(), taskId));
}
