import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import { firebaseConfigError } from "../lib/firestore";
import { TaskFormComponent } from "./task-form.component";
import { TaskListComponent } from "./task-list.component";
import { TaskStore, type CreateTaskInput, type TaskWithId } from "./task-store";

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskFormComponent, TaskListComponent],
  template: `
    <main class="app-shell">
      <section class="hero-card">
        <p class="eyebrow">&#64;bridgenodelabs/firestore-models sample</p>
        <h1>Angular Task Sample</h1>
        <p>
          This app reads Firestore documents through the model boundary and
          adapter, so legacy schemaVersion 0 task docs still render as current
          domain objects.
        </p>
      </section>

      @if (configError !== null) {
        <p class="state state--error">
          Configuration error: {{ configError }}. Fill in the values in
          samples/angular-app/src/environments/environment.ts and restart the
          dev server.
        </p>
      } @else {
        <app-task-form (create)="onCreate($event)" />

        @if (store.loading()) {
          <p class="state">Loading tasks from Firestore...</p>
        }
        @if (store.error(); as readError) {
          <p class="state state--error">Read error: {{ readError }}</p>
        }
        @if (store.mutationError(); as writeError) {
          <p class="state state--error">Mutation error: {{ writeError }}</p>
        }

        <app-task-list
          [tasks]="store.tasks()"
          [actionTaskId]="store.actionTaskId()"
          (toggle)="onToggle($event)"
          (remove)="onRemove($event)"
        />
      }
    </main>
  `,
})
export class AppComponent {
  protected readonly configError = firebaseConfigError;
  protected readonly store = inject(TaskStore);

  protected onCreate(input: CreateTaskInput): void {
    void this.store.create(input);
  }

  protected onToggle(task: TaskWithId): void {
    void this.store.toggle(task);
  }

  protected onRemove(taskId: string): void {
    void this.store.remove(taskId);
  }
}
