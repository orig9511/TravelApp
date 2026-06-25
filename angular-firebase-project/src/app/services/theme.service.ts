import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly THEME_KEY = "theme";
  private readonly DARK_MODE_CLASS = "dark-mode";

  // BehaviorSubject: reaktív változó, amely megjegyzi az aktuális értéket
  // és minden feliratkozónak elküldi az új értékeket
  private isDarkModeSubject: BehaviorSubject<boolean>;

  // Publikus Observable, amit a komponensek figyelhetnek
  public isDarkMode$: Observable<boolean>;

  constructor() {
    // localStorage-ból betöltjük a mentett témát, ha nincs, akkor false (light mode)
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    const isDark = savedTheme === "dark";

    // BehaviorSubject inicializálása a mentett értékkel
    this.isDarkModeSubject = new BehaviorSubject<boolean>(isDark);
    this.isDarkMode$ = this.isDarkModeSubject.asObservable();

    // Kezdeti téma alkalmazása
    this.applyTheme(isDark);
  }

  /**
   * Dark/Light mode váltása
   */
  toggleTheme(): void {
    const newTheme = !this.isDarkModeSubject.value;
    this.isDarkModeSubject.next(newTheme);
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
  }

  /**
   * Téma alkalmazása: dark-mode osztály hozzáadása/eltávolítása a body elemhez
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add(this.DARK_MODE_CLASS);
    } else {
      document.body.classList.remove(this.DARK_MODE_CLASS);
    }
  }

  /**
   * Téma mentése localStorage-ba
   */
  private saveTheme(isDark: boolean): void {
    localStorage.setItem(this.THEME_KEY, isDark ? "dark" : "light");
  }
}
