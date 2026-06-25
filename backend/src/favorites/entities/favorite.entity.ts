import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Offer } from "../../offers/entities/offer.entity";
import { Accommodation } from "../../accommodations/entities/accommodation.entity";

@Entity("favorites")
export class Favorite {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "offer_id", nullable: true })
  offerId: string | null;

  @ManyToOne(() => Offer, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "offer_id" })
  offer: Offer | null;

  @Column({ name: "accommodation_id", nullable: true })
  accommodationId: string | null;

  @ManyToOne(() => Accommodation, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "accommodation_id" })
  accommodation: Accommodation | null;

  @CreateDateColumn({ name: "saved_at" })
  savedAt: Date;
}
