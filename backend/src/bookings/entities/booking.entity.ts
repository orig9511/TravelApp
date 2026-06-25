import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Offer } from "../../offers/entities/offer.entity";
import { OfferInstance } from "../../offer-instances/entities/offer-instance.entity";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export enum BookingType {
  OFFER = "offer",
  FLIGHT = "flight",
}

export interface Passenger {
  fullName: string;
  phoneNumber?: string;
  address?: string;
  documentType?: "passport" | "id";
  documentNumber?: string;
}

export interface BookingExtras {
  extraBaggage?: number;
  extraLegroom?: number;
}

@Entity("bookings")
@Index(["userId"])
@Index(["offerId"])
@Index(["offerInstanceId"])
@Index(["status"])
@Index(["createdAt"])
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "booking_type",
    type: "enum",
    enum: BookingType,
    default: BookingType.OFFER,
  })
  bookingType: BookingType;

  @Column({ name: "offer_id", nullable: true })
  offerId: string;

  @ManyToOne(() => Offer, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "offer_id" })
  offer: Offer;

  @Column({ name: "offer_instance_id", nullable: true })
  offerInstanceId: string;

  @ManyToOne(() => OfferInstance, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "offer_instance_id" })
  offerInstance: OfferInstance;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  /**
   * SNAPSHOT FIELD: Denormalized user email at booking time.
   * Captured for audit trail and historical record purposes.
   * Do NOT use for current user email; always fetch from User entity.
   */
  @Column({ name: "user_email", length: 255 })
  userEmail: string;

  /**
   * SNAPSHOT FIELD: Denormalized user name at booking time.
   * Captured for audit trail and historical record purposes.
   * Do NOT use for current user name; always fetch from User entity.
   */
  @Column({ name: "user_name", length: 255 })
  userName: string;

  /**
   * SNAPSHOT FIELD: Denormalized offer title at booking time.
   * Captured for display and historical reference purposes.
   * Do NOT use for current offer title; always fetch from Offer entity.
   */
  @Column({ name: "offer_title", length: 255 })
  offerTitle: string;

  /**
   * SNAPSHOT FIELD: Departure date at booking time.
   * Captured from OfferInstance for quick access without joins.
   * Do NOT use for validations; always fetch from OfferInstance entity.
   */
  @Column({
    name: "selected_date",
    type: "timestamp with time zone",
    nullable: true,
  })
  selectedDate: Date;

  @Column({ type: "int", default: 1 })
  quantity: number;

  @Column({
    name: "idempotency_key",
    length: 255,
    nullable: true,
    unique: true,
  })
  idempotencyKey?: string;

  /**
   * SNAPSHOT FIELD: Price per person at booking time.
   * Captured for historical pricing record.
   * Do NOT use for current pricing; always fetch from OfferInstance entity.
   */
  @Column({
    name: "price_per_person",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  pricePerPerson: number;

  @Column({ name: "total_price", type: "decimal", precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: "jsonb", nullable: true })
  passengers: Passenger[];

  @Column({ type: "jsonb", nullable: true })
  extras: BookingExtras;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
