import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { OfferInstance } from "../../offer-instances/entities/offer-instance.entity";

export enum TravelCategory {
  FLIGHT = "flight",
  INDIVIDUAL = "individual",
  TOUR = "tour",
}

@Entity("offers")
@Index(["createdBy"])
@Index(["createdBy", "createdAt"])
@Index(["isInactive", "notShowable"])
@Index(["travelCategory"])
export class Offer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: "title_en", length: 255, nullable: true })
  titleEn: string;

  @Column({ name: "short_description", type: "text", nullable: true })
  shortDescription: string;

  @Column({ name: "short_description_en", type: "text", nullable: true })
  shortDescriptionEn: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "description_en", type: "text", nullable: true })
  descriptionEn: string;

  @Column({
    name: "travel_category",
    type: "enum",
    enum: TravelCategory,
    default: TravelCategory.TOUR,
  })
  travelCategory: TravelCategory;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 100, nullable: true })
  continent: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ length: 10, default: "EUR" })
  currency: string;

  @Column({ type: "int", nullable: true })
  days: number;

  @Column({ type: "int", nullable: true })
  nights: number;

  @Column({ type: "int", nullable: true })
  persons: number;

  @Column({ name: "hotel_name", length: 255, nullable: true })
  hotelName: string;

  @Column({ name: "hotel_stars", type: "int", nullable: true })
  hotelStars: number;

  @Column({ name: "hotel_address", length: 255, nullable: true })
  hotelAddress: string;

  @Column({ name: "hotel_phone", length: 50, nullable: true })
  hotelPhone: string;

  @Column({ name: "hotel_email", length: 255, nullable: true })
  hotelEmail: string;

  @Column({ type: "text", array: true, default: "{}" })
  images: string[];

  @Column({
    name: "travel_period_start",
    type: "timestamp with time zone",
    nullable: true,
  })
  travelPeriodStart: Date;

  @Column({
    name: "travel_period_end",
    type: "timestamp with time zone",
    nullable: true,
  })
  travelPeriodEnd: Date;

  @Column({ name: "is_inactive", default: false })
  isInactive: boolean;

  @Column({ name: "not_showable", default: false })
  notShowable: boolean;

  @Column({ name: "view_count", type: "int", default: 0 })
  viewCount: number;

  @Column({ name: "favorite_count", type: "int", default: 0 })
  favoriteCount: number;

  @Column({ name: "created_by", nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  creator: User;

  @OneToMany(() => OfferInstance, (instance) => instance.offer, {
    cascade: true,
  })
  instances: OfferInstance[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
