import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

import type { TaskWithId } from "./task-store";

@Component({
  selector: "app-task-list",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tasks().length === 0) {
      <section class="task-list task-list--empty">
        <p>No tasks yet. Add one to verify create/read/update/delete flows.</p>
      </section>
    } @else {
      <section class="task-list">
        <ul>
          @for (task of tasks(); track task.id) {
            <li [class]="task.done ? 'task task--done' : 'task'">
              <div class="task__main">
                <h3>{{ task.title }}</h3>
                <p>
                  <span>Priority: {{ task.priority }}</span>
                  <span>Due: {{ formatDueAt(task.dueAt) }}</span>
                </p>
              </div>

              <div class="task__actions">
                <button
                  type="button"
                  (click)="toggle.emit(task)"
                  [disabled]="task.id === actionTaskId()"
                >
                  {{ task.done ? "Mark active" : "Mark done" }}
                </button>
                <button
                  type="button"
                  class="danger"
                  (click)="remove.emit(task.id)"
                  [disabled]="task.id === actionTaskId()"
                >
                  Delete
                </button>
              </div>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class TaskListComponent {
  readonly tasks = input.required<readonly TaskWithId[]>();
  readonly actionTaskId = input<string | null>(null);

  readonly toggle = output<TaskWithId>();
  readonly remove = output<string>();

  protected formatDueAt(value: Date | undefined): string {
    if (!value) {
      return "No due date";
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  }
}
