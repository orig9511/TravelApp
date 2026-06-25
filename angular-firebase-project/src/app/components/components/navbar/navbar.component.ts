import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Observable, of, firstValueFrom, Subject, timer, fromEvent } from "rxjs";
import { map, shareReplay, switchMap, takeUntil } from "rxjs/operators";
import { ThemeService } from "../../../services/theme.service";
import { LanguageService, Language } from "../../../services/language.service";
import { AuthService } from "../../../services/auth.service";
import { Router } from "@angular/router";
import { FavoriteService } from "../../../services/favorite.service";
import { NotificationService } from "../../../services/notification.service";
import { AppUserProfile } from "../../../models/user.model";
import { Notification } from "../../../models/notification.model";
import { UserProfileService } from "../../../services/user-profile.service";

const NOTIFICATION_POLL_MS = 10_000;

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  user$: Observable<(AppUserProfile & { id: string }) | null>;
  userProfile$: Observable<AppUserProfile | null>;
  isMenuOpen = false;
  isDarkMode$: Observable<boolean>;
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private userProfileService = inject(UserProfileService);

  currentUserProfile$: Observable<AppUserProfile | null>;

  favoriteCount$: Observable<number>;
  hasFavorites$: Observable<boolean>;
  currentLanguage$: Observable<Language>;

  notifications$: Observable<Notification[]>;
  notifications: Notification[] = [];
  unreadCount$: Observable<number>;
  isNotificationsCollapsed = true;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private languageService: LanguageService,
    private favoriteService: FavoriteService,
    private notificationService: NotificationService,
  ) {
    this.user$ = this.authService.user$;
    this.currentUserProfile$ = this.userProfileService.currentUserProfile$;
    this.isDarkMode$ = this.themeService.isDarkMode$;
    this.currentLanguage$ = this.languageService.currentLanguage$;
    this.favoriteCount$ = this.favoriteService.favoriteCount$;
    this.userProfile$ = this.authService.getCurrentUserProfile();
    this.hasFavorites$ = this.favoriteService.favoriteCount$.pipe(
      map((c) => c > 0),
    );

    const sharedUser$ = this.user$.pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    // Fetch notifications reactively; re-emits on every notificationService.refresh() call
    this.notifications$ = sharedUser$.pipe(
      switchMap((user) =>
        user ? this.notificationService.getUserNotifications(5) : of([]),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    // Unread badge derived from the same stream — no extra HTTP call
    this.unreadCount$ = this.notifications$.pipe(
      map((list) => list.filter((n) => !n.read).length),
    );
  }

  ngOnInit(): void {
    // Populate local array for *ngFor
    this.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
        this.cdr.markForCheck();
      });

    // Poll every 10 s while component is alive
    timer(0, NOTIFICATION_POLL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.notificationService.refresh());

    // Instant refresh when user returns to the tab
    fromEvent(document, 'visibilitychange')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (document.visibilityState === 'visible') {
          this.notificationService.refresh();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isAdvertiserOrAdmin(userProfile: AppUserProfile | null): boolean {
    return userProfile?.role === "advertiser" || userProfile?.role === "admin";
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.style.overflow = this.isMenuOpen ? "hidden" : "";
    this.cdr.markForCheck();
  }

  closeMenu() {
    this.isMenuOpen = false;
    document.body.style.overflow = "";
    this.cdr.markForCheck();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  async logout() {
    await this.authService.logout();
    this.closeMenu();
    await this.router.navigateByUrl("/");
  }

  async onNotificationClick(notification: Notification) {
    if (!notification.read) {
      await firstValueFrom(this.notificationService.markAsRead(notification.id));
      this.notificationService.refresh();
    }

    if (notification.relatedId) {
      if (notification.type === "booking") {
        await this.router.navigate(["/my-bookings"]);
      } else if (notification.type === "offer") {
        await this.router.navigate(["/offers"]);
      }
    }

    this.closeMenu();
  }

  async dismissNotification(notificationId: string, event: Event) {
    event.stopPropagation();
    // Optimistic update
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    this.cdr.markForCheck();
    await firstValueFrom(this.notificationService.markAsRead(notificationId));
    this.notificationService.refresh();
  }

  async deleteNotification(notificationId: string, event: Event) {
    event.stopPropagation();
    // Optimistic update
    this.notifications = this.notifications.filter(
      (n) => n.id !== notificationId,
    );
    this.cdr.markForCheck();
    await firstValueFrom(this.notificationService.deleteNotification(notificationId));
    this.notificationService.refresh();
  }

  async markAllNotificationsAsRead() {
    await firstValueFrom(this.notificationService.markAllAsRead());
    this.notificationService.refresh();
  }

  toggleNotificationCollapse() {
    this.isNotificationsCollapsed = !this.isNotificationsCollapsed;
    this.cdr.markForCheck();
  }

  getTimeAgo(notification: Notification): string {
    const now = Date.now();
    const notificationTime = new Date(notification.createdAt).getTime();
    const diffInMinutes = Math.floor((now - notificationTime) / 60000);

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  trackByNotificationId(_: number, notification: Notification): string {
    return notification.id;
  }
}
