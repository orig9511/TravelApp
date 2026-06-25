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

export enum AccommodationType {
  HOTEL = "hotel",
  APARTMENT = "apartment",
  HOSTEL = "hostel",
  VILLA = "villa",
  RESORT = "resort",
  GUESTHOUSE = "guesthouse",
}

@Entity("accommodations")
@Index(["country", "city"])
@Index(["userId"])
export class Accommodation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "image_url", length: 500, nullable: true })
  imageUrl: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, nullable: true })
  type: string;

  @Column({
    name: "price_per_night",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  pricePerNight: number;

  @Column({ name: "available_places", type: "int", nullable: true })
  availablePlaces: number;

  @Column({ length: 50, nullable: true })
  mobile: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ name: "room_count", type: "int", nullable: true })
  roomCount: number;

  @Column({
    name: "capacity_per_accommodation",
    type: "int",
    nullable: true,
  })
  capacityPerAccommodation: number;

  @Column({ type: "decimal", precision: 3, scale: 1, nullable: true })
  rating: number;

  @Column({ type: "int", nullable: true })
  stars: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "description_hu", type: "text", nullable: true })
  descriptionHu: string;

  @Column({ length: 100, nullable: true })
  continent: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ type: "text", nullable: true })
  comment: string;

  @Column({ type: "text", array: true, default: "{}" })
  services: string[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
