import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new address for the current user
   */
  async create(userId: number, dto: CreateAddressDto) {
    // Validate city exists and is active
    const city = await this.prisma.city.findUnique({
      where: { id: dto.cityId },
    });
    if (!city || !city.isActive) {
      throw new BadRequestException(`City #${dto.cityId} not found or inactive`);
    }

    // If this is the first address OR isDefault=true, unset current defaults first
    const shouldBeDefault = dto.isDefault ?? false;
    const existingCount = await this.prisma.address.count({ where: { userId } });
    const makeDefault = shouldBeDefault || existingCount === 0;

    const address = await this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          houseFlatNo: dto.houseFlatNo,
          street: dto.street,
          landmark: dto.landmark,
          pincode: dto.pincode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          cityId: dto.cityId,
          isDefault: makeDefault,
        },
        include: { city: true },
      });
    });

    this.logger.log(`✅ Address created for user ${userId}`);
    return this.formatAddress(address);
  }

  /**
   * Get all addresses for the current user
   */
  async findAll(userId: number) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      include: { city: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map(a => this.formatAddress(a));
  }

  /**
   * Get a specific address (must belong to user)
   */
  async findOne(userId: number, addressId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
      include: { city: true },
    });

    if (!address) throw new NotFoundException(`Address #${addressId} not found`);
    if (address.userId !== userId) throw new ForbiddenException('Access denied');

    return this.formatAddress(address);
  }

  /**
   * Update an address
   */
  async update(userId: number, addressId: number, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address) throw new NotFoundException(`Address #${addressId} not found`);
    if (address.userId !== userId) throw new ForbiddenException('Access denied');

    // Validate new cityId if provided
    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
      if (!city || !city.isActive) {
        throw new BadRequestException(`City #${dto.cityId} not found or inactive`);
      }
    }

    if ((dto.latitude !== undefined) !== (dto.longitude !== undefined)) {
      throw new BadRequestException('Both latitude and longitude are required to update location');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Handle default switching atomically
      if (dto.isDefault === true && !address.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...(dto.houseFlatNo && { houseFlatNo: dto.houseFlatNo }),
          ...(dto.street && { street: dto.street }),
          ...(dto.landmark !== undefined && { landmark: dto.landmark }),
          ...(dto.pincode && { pincode: dto.pincode }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.cityId && { cityId: dto.cityId }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
        include: { city: true },
      });
    });

    return this.formatAddress(updated);
  }

  /**
   * Delete an address
   */
  async remove(userId: number, addressId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address) throw new NotFoundException(`Address #${addressId} not found`);
    if (address.userId !== userId) throw new ForbiddenException('Access denied');

    // Check if address is linked to an active order
    const activeOrder = await this.prisma.order.findFirst({
      where: {
        addressId,
        currentStatus: {
          notIn: ['DELIVERED', 'CANCELLED', 'REFUND_INITIATED'],
        },
      },
    });
    if (activeOrder) {
      throw new BadRequestException('Cannot delete address linked to an active order');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: addressId } });

      // If deleted address was default, promote newest remaining address
      if (address.isDefault) {
        const newest = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (newest) {
          await tx.address.update({
            where: { id: newest.id },
            data: { isDefault: true },
          });
        }
      }
    });

    this.logger.log(`✅ Address ${addressId} deleted for user ${userId}`);
    return { message: 'Address deleted successfully' };
  }

  /**
   * Set an address as default
   */
  async setDefault(userId: number, addressId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address) throw new NotFoundException(`Address #${addressId} not found`);
    if (address.userId !== userId) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.$transaction(async (tx) => {
      // Unset all current defaults atomically, then set the new one
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
        include: { city: true },
      });
    });

    return {
      message: 'Default address updated',
      address: this.formatAddress(updated),
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private formatAddress(address: any) {
    return {
      id: address.id,
      houseFlatNo: address.houseFlatNo,
      street: address.street,
      landmark: address.landmark ?? null,
      pincode: address.pincode,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
      city: address.city
        ? { id: address.city.id, name: address.city.name, state: address.city.state }
        : null,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
    };
  }
}
