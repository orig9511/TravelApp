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
import { Accommodation } from "../../accommodations/entities/accommodation.entity";

export enum ReservationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

@Entity("reservations")
@Index(["userId"])
@Index(["accommodationId"])
@Index(["startDate", "endDate"])
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "accommodation_id" })
  accommodationId: string;

  @ManyToOne(() => Accommodation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "accommodation_id" })
  accommodation: Accommodation;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "flight_id", length: 255, nullable: true })
  flightId: string;

  @Column({ name: "start_date", type: "date" })
  startDate: Date;

  @Column({ name: "end_date", type: "date" })
  endDate: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: "int", nullable: true })
  persons: number;

  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
