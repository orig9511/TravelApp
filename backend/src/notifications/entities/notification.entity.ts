import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum NotificationType {
  BOOKING = "booking",
  OFFER = "offer",
}

@Entity("notifications")
@Index(["userId", "read"])
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.BOOKING,
  })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({ name: "related_id", length: 255, nullable: true })
  relatedId: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
