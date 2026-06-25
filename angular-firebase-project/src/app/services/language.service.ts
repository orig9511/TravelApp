import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { TranslateService } from "@ngx-translate/core";

export type Language = "hu" | "en";

@Injectable({
  providedIn: "root",
})
export class LanguageService {
  private readonly LANGUAGE_KEY = "language";
  private readonly DEFAULT_LANGUAGE: Language = "hu";

  private currentLanguageSubject: BehaviorSubject<Language>;
  public currentLanguage$: Observable<Language>;

  constructor(private translateService: TranslateService) {
    const savedLanguage = localStorage.getItem(this.LANGUAGE_KEY) as Language;
    const language =
      savedLanguage === "hu" || savedLanguage === "en"
        ? savedLanguage
        : this.DEFAULT_LANGUAGE;

    this.translateService.setFallbackLang(this.DEFAULT_LANGUAGE);
    this.translateService.use(language);
    document.documentElement.lang = language;

    this.currentLanguageSubject = new BehaviorSubject<Language>(language);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();

    this.translateService.onLangChange.subscribe((event) => {
      this.currentLanguageSubject.next(event.lang as Language);
    });
  }

  toggleLanguage(): void {
    const currentLang = this.currentLanguageSubject.value;
    this.setLanguage(currentLang === "hu" ? "en" : "hu");
  }

  setLanguage(language: Language): void {
    this.translateService.use(language).subscribe({
      next: () => {
        document.documentElement.lang = language;
        localStorage.setItem(this.LANGUAGE_KEY, language);
      },
      error: () => {
        this.translateService.use(this.DEFAULT_LANGUAGE).subscribe();
        document.documentElement.lang = this.DEFAULT_LANGUAGE;
        localStorage.setItem(this.LANGUAGE_KEY, this.DEFAULT_LANGUAGE);
      },
    });
  }

  getLocalizedText(hu: string, en?: string): string {
    return this.currentLanguageSubject.value === "en" && en ? en : hu;
  }
}
