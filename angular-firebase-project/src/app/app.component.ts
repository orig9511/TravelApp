import { Component } from "@angular/core";
import { LanguageService } from "./services/language.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "angular-firebase-project";

  constructor(private languageService: LanguageService) {
    // Force service initialization at bootstrap so fallback and current lang are ready.
    void this.languageService;
  }
}
