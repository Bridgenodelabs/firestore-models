import { bootstrapApplication } from "@angular/platform-browser";
import { provideZonelessChangeDetection } from "@angular/core";

import { AppComponent } from "./app/app.component";

// Zoneless: all reactivity in this sample flows through signals, so zone.js is
// never loaded. It is an optional peer dependency of @angular/core and is
// deliberately absent from package.json.
void bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch((error: unknown) => {
  console.error(error);
});
