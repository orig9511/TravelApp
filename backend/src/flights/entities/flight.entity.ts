import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("flights")
@Index(["fromCode", "toCode"])
@Index(["departDate"])
export class Flight {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  airline: string;

  @Column({ name: "from_code", length: 10 })
  fromCode: string;

  @Column({ name: "to_code", length: 10 })
  toCode: string;

  @Column({ name: "from_label", length: 255, nullable: true })
  fromLabel: string;

  @Column({ name: "to_label", length: 255, nullable: true })
  toLabel: string;

  @Column({ name: "depart_at", length: 20, nullable: true })
  departAt: string;

  @Column({ name: "depart_date", type: "date", nullable: true })
  departDate: Date;

  @Column({ name: "arrive_at", length: 20, nullable: true })
  arriveAt: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ length: 10, default: "EUR" })
  currency: string;

  @Column({ name: "stops_count", type: "int", default: 0 })
  stopsCount: number;

  @Column({ name: "duration_minutes", type: "int", nullable: true })
  durationMinutes: number;

  @Column({ name: "is_refundable", default: false })
  isRefundable: boolean;

  @Column({ name: "has_baggage", default: false })
  hasBaggage: boolean;

  @Column({ name: "available_seats", type: "int", default: 0 })
  availableSeats: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
