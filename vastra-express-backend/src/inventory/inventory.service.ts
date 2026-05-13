import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryItemDto,
  LogInventoryTransactionDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';

interface CurrentUser {
  userId: number;
  role: string;
  facilityId?: number | null;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE INVENTORY ITEM
  // ============================================================

  async create(dto: CreateInventoryItemDto, user: CurrentUser) {
    // Facility staff can only add items to their own facility
    if (user.role === 'FACILITY_STAFF' && user.facilityId !== dto.facilityId) {
      throw new ForbiddenException('You can only manage inventory for your own facility');
    }

    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) throw new NotFoundException(`Facility #${dto.facilityId} not found`);

    // Prevent duplicate item names within the same facility
    const existing = await this.prisma.inventoryItem.findFirst({
      where: { facilityId: dto.facilityId, itemName: dto.itemName },
    });
    if (existing) {
      throw new BadRequestException(
        `Item '${dto.itemName}' already exists in this facility`,
      );
    }

    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          facilityId: dto.facilityId,
          itemName: dto.itemName,
          category: dto.category,
          quantity: dto.quantity,
          unit: dto.unit,
          lowStockThreshold: dto.lowStockThreshold,
        },
      });

      // Log initial stock as ADDITION
      if (dto.quantity > 0) {
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: created.id,
            transactionType: 'ADDITION',
            quantityChange: dto.quantity,
            balanceAfter: dto.quantity,
            notes: 'Initial stock',
            createdByUserId: user.userId,
          },
        });
      }

      return created;
    });

    this.logger.log(`✅ Inventory item '${item.itemName}' created at facility #${dto.facilityId}`);
    return item;
  }

  // ============================================================
  // LIST INVENTORY ITEMS
  // ============================================================

  async findAll(
    user: CurrentUser,
    facilityId?: number,
    category?: string,
    lowStockOnly = false,
    page = 1,
    limit = 20,
  ) {
    if (user.role === 'FACILITY_STAFF' && !user.facilityId) {
      throw new ForbiddenException('Facility assignment required');
    }

    const skip = (page - 1) * limit;

    // Facility staff are scoped to their facility
    const effectiveFacilityId =
      user.role === 'FACILITY_STAFF' ? user.facilityId : facilityId;

    const where: Prisma.InventoryItemWhereInput = {};
    if (effectiveFacilityId) where.facilityId = effectiveFacilityId;
    if (category) where.category = category.toUpperCase();

    if (lowStockOnly) {
      // When filtering for low-stock, fetch ALL matching items first (no DB-level pagination)
      // so we can compare quantity <= lowStockThreshold in memory, then paginate the result.
      const allItems = await this.prisma.inventoryItem.findMany({
        where,
        orderBy: [{ facilityId: 'asc' }, { itemName: 'asc' }],
        include: { facility: { select: { id: true, name: true } } },
      });

      const lowStockItems = allItems
        .map((item) => ({ ...item, isLowStock: Number(item.quantity) <= Number(item.lowStockThreshold) }))
        .filter((item) => item.isLowStock);

      const paginated = lowStockItems.slice(skip, skip + limit);
      return {
        data: paginated,
        meta: {
          total: lowStockItems.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(lowStockItems.length / limit)),
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ facilityId: 'asc' }, { itemName: 'asc' }],
        include: { facility: { select: { id: true, name: true } } },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    // Flag low-stock items
    const enriched = items.map((item) => ({
      ...item,
      isLowStock: Number(item.quantity) <= Number(item.lowStockThreshold),
    }));

    return {
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // GET SINGLE ITEM WITH LOGS
  // ============================================================

  async findOne(id: number, user: CurrentUser) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true } },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            createdByUser: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!item) throw new NotFoundException(`Inventory item #${id} not found`);

    if (user.role === 'FACILITY_STAFF' && user.facilityId !== item.facilityId) {
      throw new ForbiddenException('You can only view items for your own facility');
    }

    return {
      ...item,
      isLowStock: Number(item.quantity) <= Number(item.lowStockThreshold),
    };
  }

  // ============================================================
  // UPDATE ITEM METADATA (not quantity — use logTransaction for that)
  // ============================================================

  async update(id: number, dto: UpdateInventoryItemDto, user: CurrentUser) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item #${id} not found`);

    if (user.role === 'FACILITY_STAFF' && user.facilityId !== item.facilityId) {
      throw new ForbiddenException('You can only manage inventory for your own facility');
    }

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.itemName !== undefined && { itemName: dto.itemName }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.lowStockThreshold !== undefined && { lowStockThreshold: dto.lowStockThreshold }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
      },
    });
  }

  // ============================================================
  // LOG STOCK TRANSACTION (ADDITION / CONSUMPTION / ADJUSTMENT)
  // ============================================================

  /**
   * Atomically updates the item quantity and creates an InventoryLog entry.
   * - ADDITION: quantityChange must be positive
   * - CONSUMPTION: quantityChange can be positive (interpreted as how much was consumed)
   * - ADJUSTMENT: quantityChange can be positive or negative
   */
  async logTransaction(dto: LogInventoryTransactionDto, user: CurrentUser) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.inventoryItemId },
    });
    if (!item) throw new NotFoundException(`Inventory item #${dto.inventoryItemId} not found`);

    if (user.role === 'FACILITY_STAFF' && user.facilityId !== item.facilityId) {
      throw new ForbiddenException('You can only manage inventory for your own facility');
    }

    // Determine the actual quantity delta
    let delta = dto.quantityChange;
    if (dto.transactionType === 'CONSUMPTION') {
      // Consumption always reduces quantity; accept positive input and negate
      delta = -Math.abs(dto.quantityChange);
    }

    const newQuantity = Math.round((Number(item.quantity) + delta) * 100) / 100;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `Cannot consume more than available. ` +
          `Current: ${item.quantity} ${item.unit}, Requested: ${Math.abs(delta)} ${item.unit}`,
      );
    }

    const [updated] = await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id: dto.inventoryItemId },
        data: { quantity: newQuantity },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryItemId: dto.inventoryItemId,
          transactionType: dto.transactionType,
          quantityChange: delta,
          balanceAfter: newQuantity,
          notes: dto.notes ?? null,
          createdByUserId: user.userId,
        },
      });

      return [updatedItem];
    });

    const isLowStock = newQuantity <= Number(item.lowStockThreshold);
    if (isLowStock) {
      this.logger.warn(
        `⚠️ LOW STOCK: '${item.itemName}' at facility #${item.facilityId}: ${newQuantity} ${item.unit} (threshold: ${item.lowStockThreshold})`,
      );
    }

    return {
      message: 'Stock updated successfully',
      itemId: dto.inventoryItemId,
      itemName: item.itemName,
      previousQuantity: Number(item.quantity),
      delta,
      newQuantity,
      unit: item.unit,
      isLowStock,
    };
  }

  // ============================================================
  // GET TRANSACTION LOG FOR AN ITEM
  // ============================================================

  async getLogs(itemId: number, user: CurrentUser, page = 1, limit = 20) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Inventory item #${itemId} not found`);

    if (user.role === 'FACILITY_STAFF' && user.facilityId !== item.facilityId) {
      throw new ForbiddenException('You can only view logs for your own facility');
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where: { inventoryItemId: itemId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryLog.count({ where: { inventoryItemId: itemId } }),
    ]);

    return {
      item: { id: item.id, itemName: item.itemName, currentQuantity: item.quantity, unit: item.unit },
      logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // LOW-STOCK ALERT REPORT (Admin / Facility Staff)
  // ============================================================

  async getLowStockReport(user: CurrentUser) {
    if (user.role === 'FACILITY_STAFF' && !user.facilityId) {
      throw new ForbiddenException('Facility assignment required');
    }

    const facilityFilter: Prisma.InventoryItemWhereInput = {};
    if (user.role === 'FACILITY_STAFF' && user.facilityId) {
      facilityFilter.facilityId = user.facilityId;
    }

    // Filter at DB level using a raw comparison — avoids loading all items into memory
    const lowStock = await this.prisma.$queryRaw<
      Array<{
        id: number;
        item_name: string;
        category: string;
        facility_id: number;
        facility_name: string;
        quantity: number;
        low_stock_threshold: number;
        unit: string;
      }>
    >`
      SELECT
        i.id,
        i.item_name,
        i.category,
        i.facility_id,
        f.name AS facility_name,
        CAST(i.quantity AS DECIMAL(10,2)) AS quantity,
        CAST(i.low_stock_threshold AS DECIMAL(10,2)) AS low_stock_threshold,
        i.unit
      FROM inventory_items i
      JOIN facilities f ON f.id = i.facility_id
      WHERE i.quantity <= i.low_stock_threshold
        ${user.role === 'FACILITY_STAFF' && user.facilityId
          ? Prisma.sql`AND i.facility_id = ${user.facilityId}`
          : Prisma.empty}
      ORDER BY (i.low_stock_threshold - i.quantity) DESC
    `;

    return {
      total: lowStock.length,
      items: lowStock.map((item) => ({
        id: item.id,
        itemName: item.item_name,
        category: item.category,
        facility: { id: item.facility_id, name: item.facility_name },
        quantity: Number(item.quantity),
        lowStockThreshold: Number(item.low_stock_threshold),
        unit: item.unit,
        deficit: Math.round((Number(item.low_stock_threshold) - Number(item.quantity)) * 100) / 100,
      })),
    };
  }
}
