import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OfferInstance } from "./entities/offer-instance.entity";
import { Offer } from "../offers/entities/offer.entity";
import { CreateOfferInstanceDto } from "./dto/create-offer-instance.dto";
import { UpdateOfferInstanceDto } from "./dto/update-offer-instance.dto";
import { UserRole } from "../users/entities/user.entity";

@Injectable()
export class OfferInstancesService {
  constructor(
    @InjectRepository(OfferInstance)
    private readonly instanceRepository: Repository<OfferInstance>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  async findByOffer(offerId: string): Promise<OfferInstance[]> {
    return this.instanceRepository.find({
      where: { offerId },
      order: { departureDate: "ASC" },
    });
  }

  async findOne(id: string): Promise<OfferInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id },
      relations: ["offer"],
    });
    if (!instance) throw new NotFoundException("Offer instance not found");
    return instance;
  }

  async create(
    dto: CreateOfferInstanceDto,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<OfferInstance> {
    const offer = await this.offerRepository.findOne({
      where: { id: dto.offerId },
    });
    if (!offer) throw new NotFoundException("Offer not found");

    if (requesterRole !== UserRole.ADMIN && offer.createdBy !== requesterId) {
      throw new ForbiddenException(
        "You can only add instances to your own offers",
      );
    }

    const instance = this.instanceRepository.create({
      ...dto,
      departureDate: new Date(dto.departureDate),
      returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
      availableCapacity: dto.capacity,
    });

    return this.instanceRepository.save(instance);
  }

  async update(
    id: string,
    dto: UpdateOfferInstanceDto,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<OfferInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id },
      relations: ["offer"],
    });
    if (!instance) throw new NotFoundException("Offer instance not found");

    if (
      requesterRole !== UserRole.ADMIN &&
      instance.offer?.createdBy !== requesterId
    ) {
      throw new ForbiddenException(
        "You can only update instances of your own offers",
      );
    }

    Object.assign(instance, dto);
    if (dto.departureDate) instance.departureDate = new Date(dto.departureDate);
    if (dto.returnDate) instance.returnDate = new Date(dto.returnDate);

    return this.instanceRepository.save(instance);
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<void> {
    const instance = await this.instanceRepository.findOne({
      where: { id },
      relations: ["offer"],
    });
    if (!instance) throw new NotFoundException("Offer instance not found");

    if (
      requesterRole !== UserRole.ADMIN &&
      instance.offer?.createdBy !== requesterId
    ) {
      throw new ForbiddenException(
        "You can only delete instances of your own offers",
      );
    }

    await this.instanceRepository.remove(instance);
  }
}
