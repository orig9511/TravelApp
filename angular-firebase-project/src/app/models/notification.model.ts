export type NotificationType = "booking" | "offer";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // bookingId or offerId
  read: boolean;
  createdAt: string | Date;
}
