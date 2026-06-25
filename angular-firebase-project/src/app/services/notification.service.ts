import { Injectable } from "@angular/core";
import { BehaviorSubject, interval, merge, Observable } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";
import { ApiService } from "../core/api.service";
import { Notification, NotificationType } from "../models/notification.model";

@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly poll$ = merge(interval(15000), this.refresh$);

  constructor(private api: ApiService) {}

  /** Emit to force all consumers to re-fetch */
  refresh(): void {
    this.refresh$.next();
  }

  getUserNotifications(
    limitCount = 10,
    unreadOnly = false,
  ): Observable<Notification[]> {
    return this.poll$.pipe(
      debounceTime(150),
      switchMap(() =>
        this.api.get<Notification[]>("notifications", {
          limit: limitCount,
          unreadOnly: unreadOnly,
        }),
      ),
    );
  }

  getUnreadCount(): Observable<number> {
    return this.poll$.pipe(
      debounceTime(150),
      switchMap(() => this.api.get<number>("notifications/unread-count")),
    );
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.api.patch<Notification>(
      `notifications/${notificationId}/read`,
      {},
    );
  }

  markAllAsRead(): Observable<void> {
    return this.api.patch<void>("notifications/mark-all-read", {});
  }

  deleteNotification(id: string): Observable<void> {
    return this.api.delete<void>(`notifications/${id}`);
  }

  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
  ): Observable<Notification> {
    return this.api.post<Notification>("notifications", {
      userId,
      type,
      title,
      message,
    });
  }

  notifyFavoriteOfferUnavailable(
    offerId: string,
    offerTitle: string,
  ): Observable<Notification> {
    return this.api.post<Notification>("notifications/offer-unavailable", {
      offerId,
      offerTitle,
    });
  }
}
