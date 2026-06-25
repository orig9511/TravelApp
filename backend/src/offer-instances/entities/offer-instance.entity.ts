import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Offer } from "../../offers/entities/offer.entity";

@Entity("offer_instances")
@Index(["offerId"])
@Index(["departureDate"])
export class OfferInstance {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "offer_id" })
  offerId: string;

  @ManyToOne(() => Offer, (offer) => offer.instances, { onDelete: "CASCADE" })
  @JoinColumn({ name: "offer_id" })
  offer: Offer;

  @Column({ name: "departure_date", type: "timestamp with time zone" })
  departureDate: Date;

  @Column({
    name: "return_date",
    type: "timestamp with time zone",
    nullable: true,
  })
  returnDate: Date;

  @Column({
    name: "price_per_person",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  pricePerPerson: number;

  @Column({ type: "int" })
  capacity: number;

  @Column({ name: "available_capacity", type: "int" })
  availableCapacity: number;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ length: 500, nullable: true })
  image: string;

  @Column({ name: "travel_category", length: 50, nullable: true })
  travelCategory: string;

  @Column({ name: "flight_details", type: "jsonb", nullable: true })
  flightDetails: FlightDetails;

  @Column({ name: "extras_capacity", type: "jsonb", nullable: true })
  extrasCapacity: ExtrasCapacity;

  @Column({ name: "extras_available", type: "jsonb", nullable: true })
  extrasAvailable: ExtrasAvailable;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

export interface FlightDetails {
  outbound?: FlightLeg;
  return?: FlightLeg;
  aircraft?: string;
}

export interface FlightLeg {
  airline?: string;
  flightNumber?: string;
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  durationMinutes?: number;
}

export interface ExtrasCapacity {
  extraBaggage?: number;
  extraLegroom?: number;
}

export interface ExtrasAvailable {
  extraBaggage?: boolean;
  extraLegroom?: boolean;
}
