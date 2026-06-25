import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AppUserProfile } from "../models/user.model";
import { environment } from "../../environments/environment";

export interface AuthTokenPayload {
  accessToken: string;
  user: AppUserProfile & { id: string };
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly base = environment.apiUrl;
  private readonly TOKEN_KEY = "access_token";
  private readonly USER_KEY = "current_user";

  private currentUserSubject = new BehaviorSubject<
    (AppUserProfile & { id: string }) | null
  >(this.loadStoredUser());

  /** Observable of the currently logged-in user profile (null = logged out). */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  /** Compatibility alias — components may subscribe to user$ */
  readonly user$ = this.currentUser$;

  get currentUser(): (AppUserProfile & { id: string }) | null {
    return this.currentUserSubject.value;
  }

  constructor(private http: HttpClient) {}

  // ─── Auth API ────────────────────────────────────────────────────────────

  loginWithEmail(
    email: string,
    password: string,
  ): Observable<AuthTokenPayload> {
    return this.http
      .post<AuthTokenPayload>(`${this.base}/auth/login`, { email, password })
      .pipe(tap((res) => this.persist(res)));
  }

  loginWithGoogle(): void {
    window.location.href = `${this.base}/auth/google`;
  }

  handleGoogleCallback(
    token: string,
  ): Observable<AppUserProfile & { id: string }> {
    localStorage.setItem(this.TOKEN_KEY, token);
    return this.getProfile();
  }

  /** Register and auto-login */
  registerUser(userData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    username: string;
    email: string;
    password: string;
  }): Observable<AuthTokenPayload> {
    return this.http
      .post<AuthTokenPayload>(`${this.base}/auth/register`, userData)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getProfile(): Observable<AppUserProfile & { id: string }> {
    return this.http
      .get<AppUserProfile & { id: string }>(`${this.base}/auth/me`)
      .pipe(
        tap((user) => {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
      );
  }

  getCurrentUserProfile(): Observable<AppUserProfile | null> {
    return this.currentUser$;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private persist(res: AuthTokenPayload): void {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private loadStoredUser(): (AppUserProfile & { id: string }) | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
