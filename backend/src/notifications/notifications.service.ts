import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification, NotificationType } from "./entities/notification.entity";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { FavoritesService } from "../favorites/favorites.service";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly favoritesService: FavoritesService,
  ) {}

  async getUserNotifications(
    userId: string,
    limit = 50,
    unreadOnly = false,
  ): Promise<Notification[]> {
    const qb = this.notificationRepository
      .createQueryBuilder("n")
      .where("n.userId = :userId", { userId })
      .orderBy("n.createdAt", "DESC")
      .take(limit);

    if (unreadOnly) {
      qb.andWhere("n.read = false");
    }

    return qb.getMany();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async notifyOfferUnavailable(
    offerId: string,
    offerTitle: string,
  ): Promise<{ notified: number }> {
    const userIds = await this.favoritesService.getUsersWhoFavorited(offerId);
    if (userIds.length === 0) return { notified: 0 };

    await this.notifyUsers(
      userIds,
      NotificationType.OFFER,
      "Ajánlat nem elérhető",
      `A(z) "${offerTitle}" ajánlat már nem elérhető.`,
      offerId,
    );

    return { notified: userIds.length };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException("Notification not found");
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true },
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException("Notification not found");
    await this.notificationRepository.remove(notification);
  }

  async notifyUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        relatedId,
      }),
    );
    await this.notificationRepository.save(notifications);
  }
}
