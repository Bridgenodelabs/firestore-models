import { ChangeDetectionStrategy, Component, output, signal } from "@angular/core";

import { taskPriorityValues, type TaskPriority } from "../models/task";
import type { CreateTaskInput } from "./task-store";

@Component({
  selector: "app-task-form",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="task-form" (submit)="handleSubmit($event)">
      <label class="field">
        <span class="field__label">Task title</span>
        <input
          [value]="title()"
          (input)="title.set(asInput($event).value)"
          placeholder="Ship adapter docs"
          required
        />
      </label>

      <div class="task-form__row">
        <label class="field">
          <span class="field__label">Priority</span>
          <!--
            selected is bound per-option rather than binding value on the
            select itself: the select's value property is applied before the
            options exist, so it silently falls back to the first one and the
            form would display "low" while the signal held "medium".
          -->
          <select (change)="handlePriorityChange($event)">
            @for (option of priorityOptions; track option) {
              <option [value]="option" [selected]="option === priority()">
                {{ option }}
              </option>
            }
          </select>
        </label>

        <label class="field">
          <span class="field__label">Due date (optional)</span>
          <input
            type="datetime-local"
            [value]="dueAt()"
            (input)="dueAt.set(asInput($event).value)"
          />
        </label>
      </div>

      <button type="submit" [disabled]="submitting()">
        {{ submitting() ? "Creating..." : "Create task" }}
      </button>
    </form>
  `,
})
export class TaskFormComponent {
  readonly create = output<CreateTaskInput>();

  protected readonly priorityOptions = taskPriorityValues;

  protected readonly title = signal("");
  protected readonly priority = signal<TaskPriority>("medium");
  protected readonly dueAt = signal("");
  protected readonly submitting = signal(false);

  protected asInput(event: Event): HTMLInputElement {
    return event.target as HTMLInputElement;
  }

  // Angular template expressions have no `as` operator, so the narrowing from
  // the raw select value to TaskPriority lives here rather than in the markup.
  protected handlePriorityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if ((taskPriorityValues as readonly string[]).includes(value)) {
      this.priority.set(value as TaskPriority);
    }
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    this.submitting.set(true);

    try {
      const dueAtValue = this.dueAt();

      this.create.emit({
        title: this.title(),
        priority: this.priority(),
        dueAt: dueAtValue.length > 0 ? new Date(dueAtValue) : undefined,
      });

      this.title.set("");
      this.priority.set("medium");
      this.dueAt.set("");
    } finally {
      this.submitting.set(false);
    }
  }
}
